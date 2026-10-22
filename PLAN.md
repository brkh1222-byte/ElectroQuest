# ElectroQuest: implementation plan

A mobile-first PWA with three parts. **Fix it** diagnoses a broken battery device. **Salvage it** moves the device's reusable parts into an inventory. **Build with it** matches that inventory against beginner recipes and walks the user through a build.

## File structure

```
app/                      Next.js App Router (client-heavy, static where possible)
  page.tsx                Home: "Засах" / "Бүтээх" + stats
  fix/page.tsx            Device picker (+ mains-powered refusal)
  fix/[device]/page.tsx   Repair flow state machine
  scan/page.tsx           Camera → detections → refine values → confirm to inventory
  inventory/page.tsx      Editable inventory grouped by part type
  projects/page.tsx       "Build now" / "Missing 1 part" tabs
  projects/[id]/page.tsx  Recipe detail
  build/[id]/page.tsx     Build mode: highlight parts → steps → test → done
  progress/page.tsx       Badges + completed list
  model-card/page.tsx     Model card for judges (reads data/model_card.json)
  debug/page.tsx          AI call log, demo cache, detector status (dev toggle)
  api/ai/route.ts         The only server route: runs a named Claude task
components/               UI: Camera, DetectionOverlay, BreadboardSvg, SchematicSvg, …
lib/
  schemas.ts              zod schemas: recipes, devices, inventory, AI outputs, model card
  data.ts                 Typed access to data/*.json
  i18n.tsx                mn/en strings + LangProvider/useT
  db.ts                   IndexedDB wrapper (idb): inventory, scans, repairs, progress, logs, demo cache
  detector.ts             ONNX (onnxruntime-web, WebGPU→WASM) + mock mode, one interface
  defects.ts              Defect detector interface: Claude vision now, ONNX model later
  claude.ts               Server only: Anthropic SDK, prompt loading, JSON schema + zod + retry
  ai-client.ts            Browser: POST /api/ai, logging, demo record/replay
  matcher.ts              Recipe ↔ inventory matching (max-flow, no AI)
  units.ts                Value parsing/formatting (Ω, µF, V)
  resistor.ts             Colour-band decoder
  diagnosis.ts            Interview engine + scoring (tree decides, not the model)
  breadboard.ts           Breadboard connectivity → netlist (used by tests + renderer)
  safety.ts               Mains-power detection
  progression.ts          Unlocks + badges
  demo.ts                 ?demo=1 handling + fixtures
data/
  recipes/*.json          20+ recipes
  devices/*.json          tv_remote, garage_remote, game_controller
  substitutions.json      Part-number groups + value-range presets for roles
  parts.json              Part catalogue: names, ₮ prices, shop types, pick-lists
  model_card.json         Written by the training notebook
  demo/*.json             Demo detections + canned Claude responses
prompts/*.v1.md           Versioned prompts, one per task
shared/classes.json       The 18 detection classes (notebook + app)
shared/defect_classes.json
training/                 Notebooks + README
scripts/                  check-classes, validate-data, copy-ort
tests/                    vitest
public/                   PWA manifest, sw.js, models/, ort/, demo/ images
```

## Milestones (each phase ends with the app running end to end)

1. **Skeleton**: routes for every screen, i18n, IndexedDB wrapper, zod schemas, data validation script, `/api/ai` with a `ping` task.
2. **Scan + inventory**: camera (rear, torch, upload fallback), detector module (mock + ONNX), overlay, multi-photo merge that asks the user, manual inventory editing.
3. **Recipes + matcher + build mode**: 20 recipes with breadboard layouts and netlists (a test checks that each layout implements its netlist), matcher with tests, projects screen, build mode with part highlighting and SVG wiring.
4. **Value refinement**: Claude OCR for chips, transistors and capacitors. Resistor bands are read by Claude and decoded in code. LED colour comes from pixels. Every result has a "?" pick-list fallback.
5. **Repair flow**: 3 device profiles, interview engine, IR camera test, multimeter reading, board defect analysis, golden-reference compare, fix plan, did-it-work loop, salvage into inventory.
6. **Fine-tuned model**: shared class list + build check, notebook updates (model_card.json, defect target), model card page.
7. **Progression, demo mode, debug panel, PWA/offline, README, deploy notes.**
