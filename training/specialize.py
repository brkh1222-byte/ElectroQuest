"""Specialise the parts detector on our own demo kit.

    .venv/bin/python specialize.py prelabel ~/Desktop/demo_photos   # our model draws boxes, uploads to Roboflow for review
    .venv/bin/python specialize.py fetch                             # download the reviewed labels from Roboflow
    .venv/bin/python specialize.py train                             # fine-tune from the general best.pt, export, model card

Our photos are oversampled and mixed with a replay set of public images of the same part types, so the model
gets very good at our parts without forgetting the rest.
"""

import json
import random
import shutil
import sys
from pathlib import Path

import yaml

import train_local as base

WORK = base.WORK
OWN_RAW = WORK / "own_raw"          # resized copies of the photos + our model's pre-labels
OWN = WORK / "own"                  # reviewed labels downloaded from Roboflow (YOLO format)
SPEC = WORK / "specialized"         # merged training set for this stage
PROJECT = "electroquest-demo-kit"
DEMO_CLASSES = ["resistor", "led", "transistor", "ldr", "battery", "breadboard", "jumper_wire"]


def workspace():
    from roboflow import Roboflow

    return Roboflow(api_key=base.api_key()).workspace()


def prelabel(folder: str):
    from PIL import Image, ImageOps
    from pillow_heif import register_heif_opener
    from ultralytics import YOLO

    register_heif_opener()  # iPhone photos arrive as HEIC

    src = Path(folder).expanduser()
    photos = sorted(p for p in src.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".heic"))
    if not photos:
        sys.exit(f"no photos in {src}")
    shutil.rmtree(OWN_RAW, ignore_errors=True)
    (OWN_RAW / "images").mkdir(parents=True)
    (OWN_RAW / "labels").mkdir(parents=True)
    model = YOLO(str(base.RUNS / "parts" / "weights" / "best.pt"))
    ws = workspace()
    try:
        project = ws.project(PROJECT)
    except Exception:
        project = ws.create_project(PROJECT, "object-detection", "Private", "electronic parts")
    (OWN_RAW / "classes.txt").write_text("\n".join(base.CLASSES) + "\n")
    for i, p in enumerate(photos):
        img = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
        img.thumbnail((1280, 1280))
        out = OWN_RAW / "images" / f"kit_{i:03d}.jpg"
        img.save(out, quality=90)
        # Our kit only has the demo part types: don't make reviewers delete capacitors and diodes that aren't there.
        r = model.predict(str(out), conf=0.2, verbose=False, classes=[base.CLASSES.index(c) for c in DEMO_CLASSES])[0]
        lines = [f"{int(c)} {x:.6f} {y:.6f} {w:.6f} {h:.6f}" for (x, y, w, h), c in zip(r.boxes.xywhn.tolist(), r.boxes.cls.tolist())]
        lbl = OWN_RAW / "labels" / f"kit_{i:03d}.txt"
        lbl.write_text("\n".join(lines) + ("\n" if lines else ""))
        found = {}
        for c in r.boxes.cls.tolist():
            found[base.CLASSES[int(c)]] = found.get(base.CLASSES[int(c)], 0) + 1
        if lines:
            project.single_upload(image_path=str(out), annotation_path=str(lbl), annotation_labelmap=str(OWN_RAW / "classes.txt"), batch_name="demo-kit", annotation_overwrite=True)
        else:  # nothing found: upload the photo unlabelled, the reviewer draws the boxes
            project.single_upload(image_path=str(out), batch_name="demo-kit")
        print(f"{out.name}: {found}")
    print(f"\nUploaded {len(photos)} photos to Roboflow project '{PROJECT}'. Review them in Annotate, then run: specialize.py fetch")


def fetch():
    ws = workspace()
    project = ws.project(PROJECT)
    version = project.generate_version(settings={"preprocessing": {}, "augmentation": {}})
    shutil.rmtree(OWN, ignore_errors=True)
    project.version(version).download("yolov8", location=str(OWN), overwrite=True)
    print("downloaded version", version, "to", OWN)


def build(oversample=5, replay=600, seed=0):
    random.seed(seed)
    shutil.rmtree(SPEC, ignore_errors=True)
    for split in ("train", "valid"):
        (SPEC / split / "images").mkdir(parents=True)
        (SPEC / split / "labels").mkdir(parents=True)
    names = yaml.safe_load(open(OWN / "data.yaml"))["names"]
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names)]
    remap = {i: base.CLASSES.index(n) if n in base.CLASSES else (base.CLASSES.index(c) if (c := base.to_canonical(n)) else None) for i, n in enumerate(names)}
    own = [(img, Path(str(img.parent).replace("images", "labels")) / (img.stem + ".txt")) for img in OWN.rglob("*.jpg") if "images" in img.parts]
    own = [(i, l) for i, l in own if l.exists()]
    random.shuffle(own)
    n_val = max(4, len(own) // 6)
    for k, (img, lbl) in enumerate(own):
        lines = []
        for line in lbl.read_text().splitlines():
            parts = line.split()
            if len(parts) == 5 and remap.get(int(parts[0])) is not None:
                lines.append(" ".join([str(remap[int(parts[0])])] + parts[1:]))
        split = "valid" if k < n_val else "train"
        copies = 1 if split == "valid" else oversample
        for c in range(copies):
            name = f"own_{k}_{c}"
            shutil.copy(img, SPEC / split / "images" / f"{name}.jpg")
            (SPEC / split / "labels" / f"{name}.txt").write_text("\n".join(lines) + "\n")
    # Replay: public photos that contain our demo part types, so the model keeps its general skill.
    want = {base.CLASSES.index(c) for c in DEMO_CLASSES}
    pool = []
    for lbl in (base.MERGED / "train" / "labels").glob("*.txt"):
        if any(int(l.split()[0]) in want for l in lbl.read_text().splitlines() if l.strip()):
            pool.append(lbl)
    for lbl in random.sample(pool, min(replay, len(pool))):
        img = next((base.MERGED / "train" / "images").glob(lbl.stem + ".*"))
        shutil.copy(img, SPEC / "train" / "images" / img.name)
        shutil.copy(lbl, SPEC / "train" / "labels" / lbl.name)
    yaml.safe_dump({"path": str(SPEC), "train": "train/images", "val": "valid/images", "names": base.CLASSES, "nc": len(base.CLASSES)}, open(SPEC / "data.yaml", "w"))
    print(f"own photos: {len(own) - n_val} train (x{oversample}) + {n_val} valid; replay: {min(replay, len(pool))}")
    return len(own)


def train(epochs=25):
    import torch
    from ultralytics import YOLO

    n_own = build()
    device = "mps" if torch.backends.mps.is_available() else (0 if torch.cuda.is_available() else "cpu")
    general = base.RUNS / "parts" / "weights"
    start = general / "general_best.pt" if (general / "general_best.pt").exists() else general / "best.pt"
    model = YOLO(str(start))  # start from our general fine-tuned model
    model.train(data=str(SPEC / "data.yaml"), epochs=epochs, imgsz=640, batch=16, patience=8, lr0=0.002, optimizer="AdamW",
                device=device, project=str(base.RUNS), name="specialized", exist_ok=True, workers=4)
    # Score on our own held-out kit photos, then export through the normal finisher.
    best = base.RUNS / "specialized" / "weights" / "best.pt"
    general = base.RUNS / "parts" / "weights" / "best.pt"
    if not (general.parent / "general_best.pt").exists():
        shutil.copy(general, general.parent / "general_best.pt")  # keep the general model to fall back to
    shutil.copy(best, general)
    stats = json.load(open(WORK / "merge_stats.json"))
    stats["images"]["own_photos"] = n_own
    json.dump(stats, open(WORK / "merge_stats.json", "w"), indent=2)
    base.finish()
    own_metrics = YOLO(str(best)).val(data=str(SPEC / "data.yaml"), imgsz=640, plots=False, project=str(WORK / "val"), name="own", exist_ok=True)
    print("on our own kit photos:", json.dumps({"map50": float(own_metrics.box.map50), "precision": float(own_metrics.box.mp), "recall": float(own_metrics.box.mr)}))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "prelabel":
        prelabel(sys.argv[2] if len(sys.argv) > 2 else "~/Desktop/demo_photos")
    elif cmd == "fetch":
        fetch()
    elif cmd == "train":
        train()
    else:
        sys.exit(__doc__)
