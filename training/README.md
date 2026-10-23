# Training the parts detector

`parts_detector_finetune.ipynb` fine-tunes YOLO11 to find our 18 part types in phone photos. It exports `best.onnx`, which the web app runs in the browser.

The class list lives in **`shared/classes.json`**. The notebook's `CLASSES = [...]` must match it exactly: same names, same order. `npm run build` (via `scripts/check-classes.mjs`) fails if they differ. To add a class, edit both, then add the part to `data/parts.json`.

## 1. Take photos (most important step)

Take 150–300 photos with phones:

- Parts spread on a table, **and** messy piles where parts overlap.
- **Different backgrounds:** white paper, wooden table, dark cloth, school desk.
- **Different light:** daylight, room lamp, phone flashlight, a bit of shadow.
- **Different angles and distances:** straight down, tilted, close-up, whole table.
- Every class at least 30 times. Breadboards, Arduinos and batteries show up often; diodes, potentiometers and buzzers need extra photos.
- The same parts our users will have: the starter kits sold in Ulaanbaatar.

Put them in Google Drive at `MyDrive/parts_photos/`.

## 2. Run the notebook in Colab

1. `Runtime → Change runtime type → T4 GPU`.
2. Paste your Roboflow API key in section 2. Check each dataset in `SOURCES`, open it on Roboflow Universe, and make sure the images look like our use case.
3. Section 3 auto-labels your photos with YOLO-World.

## 3. Review the auto-labels

YOLO-World is a good first draft, not ground truth.

1. Upload `/content/autolabel` to a Roboflow project (it reads YOLO format).
2. Fix every image: delete wrong boxes, redraw loose ones, add missed parts. Common mistakes: LED vs diode, resistor vs jumper wire, button vs IC.
3. Export as **YOLOv8** and add the export to `SOURCES`, so it is used instead of the raw auto-labels.

Fixing pre-drawn boxes is about 5× faster than drawing from scratch.

## 4. Train

Run sections 4–6. `yolo11s` takes about 20–60 minutes on a free T4. If the app is too slow on weak phones, use `yolo11n` (see "Speed" below).

## 5. Read the metrics

- **mAP50 > 0.7** is good for a demo; **> 0.85** is great.
- Look at the **per-class** table, not just the average. A class with low mAP and few boxes needs more of your own photos of that part.
- The **confusion matrix** shows which classes get mixed up (e.g. led ↔ diode). Add photos that show the difference.
- Always try the model on photos it never saw (section 6 does one).

## 6. Put the model in the app

Section 7 saves everything to `MyDrive/parts_model/`. Then:

| From Drive | To the repo |
|---|---|
| `best.onnx` | `public/models/best.onnx` |
| `model_card.json` | `data/model_card.json` (shown on the in-app **Model card** page) |
| `examples/*.jpg` | `public/models/examples/` |

Reload the app. In Debug, the detector shows `best.onnx: found`, and scans run on the real model (WebGPU, or WASM as fallback).

**Speed:** target under 1.5 s per photo on a mid-range Android. If it's slower, export `yolo11n` and/or `imgsz=512` (and set the same size in `lib/detector.ts` → `YoloModel.load(..., imgsz)`), or set `NEXT_PUBLIC_DETECTOR_URL` to run detection on a server.

## Second target: board defects

`board_defects_finetune.ipynb` trains a detector for `corroded, burnt, bulging_cap, cracked_joint, worn_pad` (from `shared/defect_classes.json`) on repair photos. Until it exists, the app finds defects with Claude vision. Drop the export at `public/models/defects.onnx` and the app switches to it automatically (`lib/defects.ts`). The UI stays the same.
