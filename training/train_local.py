"""Train the parts detector locally (Apple Silicon MPS, CUDA, or CPU) — same pipeline as the Colab notebook.

    cd training && uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python ultralytics roboflow onnx onnxslim
    .venv/bin/python train_local.py download     # fetch + merge public datasets, print class balance
    .venv/bin/python train_local.py train        # fine-tune, validate, export ONNX, write the model card

Reads ROBOFLOW_API_KEY from ../.env.local. Outputs go to ../public/models/ and ../data/model_card.json.
"""

import datetime
import json
import random
import re
import shutil
import sys
from collections import Counter
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
WORK = Path(__file__).resolve().parent / "work"
SRC = WORK / "src"
MERGED = WORK / "merged"
RUNS = WORK / "runs"

# The one class list for the whole project (shared with the web app).
CLASSES = json.loads((ROOT / "shared" / "classes.json").read_text())

# (workspace, project, version) — public Roboflow Universe datasets, all checked for class coverage.
SOURCES = [
    ("charles-dominique-bacanto-sk3id", "arduino-ugn9a", 5),   # Arduino, breadboard, jumper wires, IC, LED, transistor, resistor…
    ("laboratorio-c", "arduino-modules", 4),                    # buzzer, potentiometer, light + distance sensors
    ("electronic-components-3jxxm", "electronics4", 8),         # IC, capacitor, button, resistor
    ("datasetsynthesis", "electrocom-61", 9),                   # diode, batteries, servo, DC motor, displays, LDR, buzzer…
    ("phase-1-testing", "new-phase-1", 2),                      # diode, battery, LCD, motor, photoresistor, servo…
    ("school-p0xt8", "electric-components-kkgsp", 2),           # small loose-kit set
]

# Source class names that look like ours but are different parts: drop them first.
DROP = ["driver", "drive", "hbridge", "icbase", "relay", "multimeter", "rectifier", "joystick", "thermistor", "rocker"]

# Keyword rules, matched IN ORDER ("photoresistor" → ldr before resistor, "servo motor" → servo before motor).
RULES = [
    (["ldr", "photoresistor", "lightdependent", "photocell", "luzsensor"], "ldr"),
    (["potentiometer", "pot", "trimmer", "variableresistor", "potenciometro"], "potentiometer"),
    (["resistor", "registor"], "resistor"),
    (["led", "lightemitting"], "led"),
    (["diode", "zener"], "diode"),
    (["capacitor", "cap", "capaitor"], "capacitor"),
    (["transistor", "mosfet", "bjt"], "transistor"),
    (["ic", "integratedcircuit", "chip", "ne555", "555", "dip"], "ic"),
    (["button", "pushbutton", "switch", "tactile"], "button"),
    (["buzzer", "piezo", "speaker"], "buzzer"),
    (["battery", "batteryholder", "cell"], "battery"),
    (["breadboard"], "breadboard"),
    (["arduino", "uno", "nano", "esp32", "leonardo"], "arduino"),
    (["jumper", "wire", "cable", "dupont"], "jumper_wire"),
    (["servo"], "servo"),
    (["motor"], "dc_motor"),
    (["ultrasonic", "hcsr04", "sonar", "distancia"], "ultrasonic_sensor"),
    (["display", "lcd", "oled", "7segment", "sevensegment"], "display"),
]


def to_canonical(name: str):
    low = name.lower()
    joined = re.sub(r"[^a-z0-9]", "", low)
    if any(d in joined for d in DROP):
        return None
    tokens = set(re.findall(r"[a-z0-9]+", low))
    tokens |= {t[:-1] for t in tokens if t.endswith("s") and len(t) > 2}
    for keys, target in RULES:
        if any(k in tokens or k == joined.rstrip("s") or (len(k) > 3 and k in joined) for k in keys):
            return target
    return None


def api_key() -> str:
    for line in (ROOT / ".env.local").read_text().splitlines():
        if line.startswith("ROBOFLOW_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("ROBOFLOW_API_KEY missing from .env.local")


def download():
    from roboflow import Roboflow

    rf = Roboflow(api_key=api_key())
    SRC.mkdir(parents=True, exist_ok=True)
    for ws, proj, ver in SOURCES:
        dest = SRC / proj
        if (dest / "data.yaml").exists():
            print("cached", proj)
            continue
        rf.workspace(ws).project(proj).version(ver).download("yolov8", location=str(dest), overwrite=True)
        print("downloaded", proj)


def merge(valid_frac=0.12, seed=0):
    random.seed(seed)
    shutil.rmtree(MERGED, ignore_errors=True)
    for split in ("train", "valid"):
        (MERGED / split / "images").mkdir(parents=True)
        (MERGED / split / "labels").mkdir(parents=True)
    counts, mapping_report = {}, {}
    for _, proj, _ in SOURCES:
        root = SRC / proj
        names = yaml.safe_load(open(root / "data.yaml"))["names"]
        if isinstance(names, dict):
            names = [names[k] for k in sorted(names)]
        remap = {i: (CLASSES.index(c) if (c := to_canonical(n)) else None) for i, n in enumerate(names)}
        mapping_report[proj] = {n: (CLASSES[remap[i]] if remap[i] is not None else "—") for i, n in enumerate(names)}
        n = 0
        for img in root.rglob("*"):
            if img.suffix.lower() not in (".jpg", ".jpeg", ".png") or "images" not in img.parts:
                continue
            lbl = Path(str(img.parent).replace("images", "labels")) / (img.stem + ".txt")
            if not lbl.exists():
                continue
            lines = []
            for line in lbl.read_text().splitlines():
                parts = line.split()
                if len(parts) != 5:
                    continue  # segmentation polygons
                new = remap.get(int(parts[0]))
                if new is not None:
                    lines.append(" ".join([str(new)] + parts[1:]))
            if not lines:
                continue
            # Keep the sources' own validation splits; otherwise hold out a random share.
            split = "valid" if ("valid" in img.parts or "test" in img.parts or random.random() < valid_frac * 0.3) else "train"
            name = f"{proj}_{n}{img.suffix.lower()}"
            shutil.copy(img, MERGED / split / "images" / name)
            (MERGED / split / "labels" / f"{proj}_{n}.txt").write_text("\n".join(lines) + "\n")
            n += 1
        counts[proj] = n
    yaml.safe_dump(
        {"path": str(MERGED), "train": "train/images", "val": "valid/images", "names": CLASSES, "nc": len(CLASSES)},
        open(MERGED / "data.yaml", "w"),
    )
    boxes = Counter()
    for f in (MERGED / "train" / "labels").glob("*.txt"):
        for line in f.read_text().splitlines():
            boxes[CLASSES[int(line.split()[0])]] += 1
    json.dump({"images": counts, "train_boxes": boxes}, open(WORK / "merge_stats.json", "w"), indent=2)
    json.dump(mapping_report, open(WORK / "class_mapping.json", "w"), indent=2, ensure_ascii=False)
    print("images per source:", counts)
    for c in CLASSES:
        print(f"  {c:18s} {boxes[c]:6d} train boxes")
    print("train/valid images:", len(list((MERGED / "train" / "images").iterdir())), len(list((MERGED / "valid" / "images").iterdir())))


def train(model_name="yolo11n.pt", epochs=60, imgsz=640):
    import torch
    from ultralytics import YOLO

    device = "mps" if torch.backends.mps.is_available() else (0 if torch.cuda.is_available() else "cpu")
    model = YOLO(model_name)  # COCO pre-trained; we fine-tune it on our parts
    model.train(
        data=str(MERGED / "data.yaml"), epochs=epochs, imgsz=imgsz, batch=16, patience=15,
        device=device, project=str(RUNS), name="parts", exist_ok=True, workers=4,
    )
    finish(model_name, imgsz)


def finish(model_name="yolo11n.pt", imgsz=640, snapshot=False):
    """Validate + export. snapshot=True copies the current best checkpoint first and runs on CPU,
    so an interim model can ship while training keeps the GPU."""
    from ultralytics import YOLO

    weights = RUNS / "parts" / "weights" / "best.pt"
    device = None
    if snapshot:
        snap = WORK / "snapshot"
        snap.mkdir(exist_ok=True)
        shutil.copy(weights, snap / "best.pt")
        weights, device = snap / "best.pt", "cpu"
    best = YOLO(str(weights))
    metrics = best.val(data=str(MERGED / "data.yaml"), imgsz=imgsz, plots=False, device=device, project=str(WORK / "val"), name="snap" if snapshot else "final", exist_ok=True)
    onnx_path = Path(best.export(format="onnx", imgsz=imgsz, simplify=True))
    out = ROOT / "public" / "models"
    out.mkdir(parents=True, exist_ok=True)
    shutil.copy(onnx_path, out / "best.onnx")

    ex_dir = out / "examples"
    shutil.rmtree(ex_dir, ignore_errors=True)
    ex_dir.mkdir()
    examples = []
    val_imgs = sorted((MERGED / "valid" / "images").iterdir())
    random.seed(1)
    for i, p in enumerate(random.sample(val_imgs, min(4, len(val_imgs)))):
        r = best.predict(str(p), conf=0.3, verbose=False)[0]
        r.save(filename=str(ex_dir / f"example_{i}.jpg"))
        examples.append({"image": f"/models/examples/example_{i}.jpg", "caption": f"{len(r.boxes)} parts found"})

    stats = json.load(open(WORK / "merge_stats.json"))
    box = metrics.box
    ap50 = {int(c): float(v) for c, v in zip(box.ap_class_index, box.ap50)}
    epochs_run = None
    results_csv = RUNS / "parts" / "results.csv"
    if results_csv.exists():
        epochs_run = max(0, len(results_csv.read_text().strip().splitlines()) - 1)
    card = {
        "status": "trained",
        "model_name": "parts-detector",
        "base_model": f"{model_name.removesuffix('.pt')} (COCO pre-trained)",
        "trained_at": datetime.date.today().isoformat(),
        "image_size": imgsz,
        "epochs": epochs_run,
        "data": {
            "public_datasets": [
                {"name": proj, "url": f"https://universe.roboflow.com/{ws}/{proj}", "images": stats["images"].get(proj)}
                for ws, proj, _ in SOURCES
            ],
            "own_photos": stats["images"].get("own_photos", 0),
            "train_images": len(list((MERGED / "train" / "images").iterdir())),
            "val_images": len(val_imgs),
        },
        "metrics": {"map50": float(box.map50), "map50_95": float(box.map), "precision": float(box.mp), "recall": float(box.mr)},
        "per_class": [{"name": c, "train_boxes": int(stats["train_boxes"].get(c, 0)), "map50": ap50.get(i)} for i, c in enumerate(CLASSES)],
        "examples": examples,
    }
    (ROOT / "data" / "model_card.json").write_text(json.dumps(card, indent=2) + "\n")
    print(json.dumps(card["metrics"], indent=2))
    print("ONNX:", out / "best.onnx", f"{(out / 'best.onnx').stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    if cmd in ("download", "all"):
        download()
        merge()
    if cmd in ("train", "all"):
        train()
    if cmd == "finish":
        finish()
    if cmd == "snapshot":
        finish(snapshot=True)
