# Decisions

These are choices the brief left open or that couldn't be done exactly as written. Each was decided and the work continued.

## Platform

- **Cache Components is off.** Next.js 16 scaffolds with `cacheComponents: true`. This app is local-first and client-rendered (IndexedDB, camera), so server caching adds nothing, while its Suspense rules complicate every page. Recipe, project and device pages are statically generated with `generateStaticParams`.
- **onnxruntime-web is loaded at runtime, not bundled.** `npm install` copies the runtime into `public/ort/` (`scripts/copy-ort.mjs`, git-ignored). `lib/yolo.ts` imports it from there. This avoids bundler trouble with WASM workers and lets the service worker cache it for offline use. WebGPU is tried first, then WASM. On WASM, inference runs in a worker (`env.wasm.proxy`), so the UI never freezes.
- **COOP/COEP headers** (`next.config.ts`) make the page cross-origin isolated, so WASM can use multiple threads on phones without WebGPU. Everything is same-origin, so nothing breaks.
- **Placeholder model = mock mode, not a COCO model.** An off-the-shelf COCO YOLO has none of our 18 classes, so it would find nothing on a parts pile. `lib/detector.ts` has an `auto` mode: it uses `public/models/best.onnx` as soon as the file exists and mock mode until then. Mock mode returns the recorded detections for demo photos, and a fake grid of boxes otherwise. The debug panel can force `onnx`, `mock` or `remote`. `remote` posts to `NEXT_PUBLIC_DETECTOR_URL` for weak phones.
- **Claude models:** `CLAUDE_MODEL_FAST=claude-haiku-5-5` (OCR, free-text mapping, chat) and `CLAUDE_MODEL_STRONG=claude-opus-5-5` (board defects, golden compare). Opus/Sonnet calls enable the server-side refusal fallback (`fallbacks: "default"`). Output is JSON constrained by a schema, validated with zod, and retried once.
- **Credentials:** `/api/ai` lets the Anthropic SDK find credentials (normally `ANTHROPIC_API_KEY`). If none are found, it returns 503 with a clear message. The client shows retry/offline UI, and demo mode replays recorded answers.

## Feature A (scan + build)

- **Merging photos:** when a new photo contains part types already seen, the app asks once per part type: "same parts (another angle)" keeps max(before, now), and "new parts" adds them.
- **Jumper wires are not matched.** Recipes list them under `materials` ("you'll also need 3× jumper wire"), because people rarely scan every wire.
- **Buzzer type is always asked.** Active and passive buzzers can't be told apart reliably from a photo.
- **LED colour comes from pixels, not Claude** (`ledColorFromCrop`). Water-clear LEDs look white whatever their colour, so they're marked "?".
- **An infrared LED never fills a visible-LED slot**, because it looks dead to the user.
- **Wiring diagrams:** every recipe has an exact breadboard layout (holes, wires) and a netlist. `tests/data.test.ts` checks that each layout builds exactly its netlist, with no shared holes, a series resistor on every LED, and DIP chips straddling the gap. Build mode draws the breadboard step by step from the layout. The `schematic` field renders as a connection map (one bus per net) rather than a hand-drawn symbol schematic.
- **Value safety:** LED resistor ranges depend on the supply: 390Ω–2.2kΩ at 9V, 220Ω–1kΩ at 5–6V. A test checks every recipe stays under 25 mA for a red LED at the highest accepted battery voltage. Another test checks the night-light divider: off in room light (LDR ≈ 2kΩ) and on in the dark for every accepted top resistor.
- **Transistor pinouts differ** (BC547 C-B-E; 2N2222/2N3904/S8050 E-B-C). There is one layout, and build mode tells the user how to orient the exact part they're using.
- **Locked recipes** can be read but not started. Level 2 opens after one level-1 project, level 3 after two level-2 projects. Demo mode unlocks everything.

## Feature B (repair)

- **Scoring:** each cause starts at its frequency, and every answer, test outcome and visual finding multiplies it (0 rules it out). Findings are softened by confidence (`effect^confidence`). The JSON decides the question order (`ask_if`). Claude only maps free-text answers to one of the options; we don't let it rephrase questions, so the wording stays reviewable.
- **Mains safety is enforced twice:** a keyword filter (`lib/safety.ts`, mn + en) runs before anything reaches Claude, and the system prompt repeats the rule. The device picker only offers the three battery devices.
- **Golden reference:** we have one, for the demo TV remote (`public/demo/golden-tv-remote.svg`). Add real photos per model in `data/devices/*.json → golden_references`.
- **Defect model:** `lib/defects.ts` uses `public/models/defects.onnx` when it exists, otherwise Claude vision. Findings have the same shape either way, so the UI doesn't change.
- **Second demo device:** the board-photo step in demo mode offers "demo photo 1" (corroded remote, fixable) and "demo photo 2" (burnt chip → unfixable → salvage). The salvaged S8050 transistor is what completes the night light in step 5 of the script.

## Content

- **Prices (₮) and shop types are estimates** and need checking in Ulaanbaatar before the final. They live in `data/parts.json` and `data/devices/*.json` (`price_mnt`, `shop_price_mnt`).
- **Mongolian text was written with AI help** and needs a read-through by a native speaker, especially the repair steps.
- **Demo images are SVG illustrations** (`scripts/gen-demo-assets.mjs`), not photos. Before the final, photograph the real starter kit and remotes, run a scan, and use Debug → "Export last scan as fixture.json" to re-record `data/demo/fixtures.json`.
