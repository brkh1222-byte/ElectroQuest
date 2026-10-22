# ElectroQuest

A phone app that fixes broken battery-powered gadgets and then builds new projects from their parts.

1. **Fix it.** The app diagnoses a TV/AC remote, garage remote or game controller (ask → look → test → decide) and shows a fix plan with the cost compared to a repair shop.
2. **Salvage it.** If the device can't be fixed, you scan the board and its reusable parts go into your parts inventory.
3. **Build with it.** You scan a pile of parts, and the app suggests projects you can build right now (like Brickit for LEGO), highlights which parts to pick up, and walks you through the build step by step.

The UI is in Mongolian by default, with an English toggle. It's a mobile-first PWA: everything except Claude calls works offline.

## Setup

```bash
npm install                  # also copies onnxruntime-web into public/ort
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Open on a phone (same Wi-Fi): `npm run dev -- -H 0.0.0.0`, then go to `http://<laptop-ip>:3000`. Camera access needs HTTPS on phones, so use the Vercel preview, or `npx next dev --experimental-https`.

| Command | What it does |
|---|---|
| `npm test` | Unit tests: matcher, resistor decoder, marking parser, diagnosis scoring, progression, every recipe/device file, class-list sync |
| `npm run check:data` | Validate all JSON in `data/` (also runs before every build) |
| `npm run check:classes` | Fails if the notebooks' class lists differ from `shared/*.json` |
| `npm run typecheck` / `npm run lint` | TypeScript strict / ESLint |
| `npm run build` | Production build (runs both checks first) |
| `node scripts/live-check.mjs http://localhost:3000` | Calls every Claude task with known images and checks the answers (needs the dev server and an API key; costs a few cents) |

## Deploy (Vercel)

1. Import the repo in Vercel (framework: Next.js; build command: `npm run build`).
2. Add `ANTHROPIC_API_KEY` (and optionally `CLAUDE_MODEL_FAST`, `CLAUDE_MODEL_STRONG`) under Project → Settings → Environment Variables, or run `vercel env add ANTHROPIC_API_KEY`.
3. Deploy. The API key is only read by `app/api/ai/route.ts` on the server and never reaches the browser.

## Demo mode

Open **`/?demo=1`** (turn it off with `/?demo=0`). In demo mode:

- Camera screens offer **demo photos** (the parts pile and two broken remote boards), whose detections are recorded in `data/demo/fixtures.json`.
- Every Claude call on the scripted path is **recorded** on the first successful run. If Claude or the Wi-Fi fails later, the recording is **replayed**; if there's no recording, a canned answer from `data/demo/claude-cache.json` is used.
- All recipe levels are unlocked.

Before going on stage, run the full script once with Wi-Fi so the real Claude answers get recorded. Open **Debug** (home page link → enable developer mode) to see every AI call with latency and a live/replay/canned tag, and the recorded answers.

**Stage script**

1. Fix → TV remote → *Not at all* → *Just changed them* → *Neither* → *Not sure* → IR camera test (no flash) → skip multimeter.
2. Open it → board photo (demo photo 1) → corroded battery contacts + cracked IR LED joint → fix plan: 500₮ vs 15,000₮ at a shop.
3. A teammate fixes it → *It works!*
4. Fix → TV remote again → … → demo photo 2 (burnt chip) → *Not worth fixing* → Salvage → parts (incl. an S8050 transistor) go to the inventory.
5. Build → scan → demo photo (parts pile) → read values → add → "You can build: Night light…" → parts highlighted on the photo → build step by step → cover the light sensor → it turns on.

## How to add a recipe (no code)

1. Copy a similar file in `data/recipes/` and give it a new `id` (same as the file name).
2. Edit `title`, `summary`, `what_you_learn`, `test`, `safety` (each has `mn` and `en`).
3. `slots`: the parts it needs. Each slot has `part_type` (one of `shared/classes.json`), `quantity`, and `accept`, either a range (`"ohms": {"min": 220, "max": 1000}`) or a preset/group from `data/substitutions.json` (`"preset": "led_resistor_5v"`, `"group": "npn_small"`). `preferred` is what we suggest buying.
4. `layout`: where every leg goes on the breadboard (`"a5"`, `"t+3"` = top plus rail, `"b-7"` = bottom minus rail). Off-board parts (battery, Arduino, servo, motor) are connected with wires to `"BAT.+"`, `"ARD.D9"`, etc.
5. `schematic.nets`: which pins are connected (`"R1.2"`, `"LED1.A"`, `"BAT.-"`).
6. `steps`: the text for each step, plus `add`: which components/wires are placed in that step.
7. Run `npm run check:data`. It tells you if the layout doesn't build the schematic, a hole is used twice, an LED has no resistor, or a step forgets a part.

## How to add a device profile

Add `data/devices/<id>.json` (copy `tv_remote.json`). It needs:

- `causes`: each with `frequency` (prior), a `fix` plan with prices, `shop_price_mnt`, steps and safety. Mark one cause `unfixable` so the flow can end in salvage.
- `questions`: answers with `effects` (`{"cause_id": multiplier}`; `0` rules a cause out). Use `ask_if` to ask a question only after certain answers.
- `tests`: `ir_camera`, `multimeter_battery` (with `battery_options`) or `yes_no`.
- `visual_checks`: how each defect type seen on the board photo moves the causes.
- `salvage`: the parts you usually get out of it.

The device must be battery-powered (`"power": "battery"`). Then run `npm run check:data`.

## Project layout

See [PLAN.md](PLAN.md) for the file structure and milestones, [DECISIONS.md](DECISIONS.md) for the judgement calls, and [training/README.md](training/README.md) for the fine-tuned model.
