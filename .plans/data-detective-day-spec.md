# Data Detective Day, Python for AI, and UI Polish: Spec

Branch: `beginner-lessons`. Date: 2026-10-21. Builds on `.plans/beginner-curriculum-spec.md` (curriculum, engine, contests v1).

## 1. Decisions from the interview

| Topic | Decision |
|---|---|
| Contest model | Contests are **events**, not weekly. **Beginner Weekly #1 is removed**, and the first real contest is **Data Detective Day**. |
| Event timing | **Starts now for testing:** from 2026-10-21 for 7 days, so the team can try the flow. It will be rescheduled for the real event later, by editing the dates in the YAML. |
| Event problems | **Mixed, 4 fresh problems:** 3 prompt problems on real dataset rows and 1 short pipeline (Python + model) problem. They are contest-only while the contest is upcoming or running, and move into the bank when it ends. |
| Data | **Real open datasets.** Download small samples (at most a few hundred rows) from Hugging Face or UCI, permissive licenses only. Each problem records its source, license and citation. |
| Data problem shape | **Real dataset rows** (prompt problems: classify or extract one row per test) **and beginner Python + data** (Python over a dataset file). |
| New lessons | **"Python for AI" track, 5 lessons from zero:** variables & lists → loops & counting → reading a dataset → calling the model from Python (`evalquest` SDK) → classifying a whole dataset and measuring accuracy. |
| UI | **Whole-app polish pass:** one consistent system of radius, shadows, icons, motion, spacing and light/dark theme. Uses the `jmo-workflow:better-ui` guidance. |

## 2. Data Detective Day (contest)

- **File:** `contests/data-detective-day.yaml`. Starts 2026-10-21T00:00Z, ends 2026-10-28T00:00Z for now. Delete `contests/beginner-weekly-1.yaml`.
- **Description (simple English):** "Real data, real mess. Four puzzles built from public datasets."
- **Problems (all `easy`, beginner-friendly, fresh):**
  1. **Spam or not** (prompt, `label_accuracy`, labels `spam` / `ham`): real SMS messages, e.g. the UCI SMS Spam Collection (CC BY 4.0).
  2. **News desk** (prompt, `label_accuracy`, 4 topics): real news headlines and descriptions, e.g. AG News `world` / `sports` / `business` / `sci-tech`.
  3. **Bank helpdesk intent** (prompt, `label_accuracy`, about 5 intents chosen from a larger set): real customer queries, e.g. banking77 (CC BY 4.0). The statement lists the allowed intents with one-line definitions.
  4. **Count the complaints** (pipeline, Python): a small fixture dataset of real reviews or SMS. The learner writes a short function that uses `llm.chat` on each row and returns a count or summary for the test's slice. Scored with the existing pipeline metrics.
- The authoring agent may substitute datasets if a source is unavailable or its license is unclear. Licenses must be permissive, and the source must be recorded.
- **Contest-only visibility:** a problem whose `problem.yaml` has `contest: data-detective-day`:
  - While that contest is upcoming or running, it is **left out** of `/problems`, track lists and search.
  - Its problem page is reachable only from the contest page while the contest runs. Before the start it returns 404.
  - After the contest ends, it appears in the bank like any other problem.
  - Run, Submit, Show answer and the existing contest rules (no answer reveal for participants while it runs) still apply.
- Dataset provenance lives in each problem's `data/SOURCE.md`: dataset name, URL, license, citation, how rows were sampled, and edits made.

## 3. Python for AI track (`tracks/python-for-ai.yaml`, order 5)

The same lesson style as the other tracks: simple English, a Key idea callout, "Your task". It assumes zero coding experience.

| # | Lesson | Problem | Type |
|---|---|---|---|
| 1 | Your First Python: values, variables, lists | `count-words`-style function on a list | `scratch` (free, runs in the browser) |
| 2 | Loops and Counting | Count labels in a list / find the most common | `scratch` |
| 3 | Reading a Dataset (rows as dicts, simple filtering) | Answer a question over a small fixture dataset | `scratch` with fixtures, or args |
| 4 | Calling the Model from Python (`from evalquest import llm`) | Wrap a prompt in a function: `classify(text)` | `pipeline` |
| 5 | Classify a Whole Dataset and Measure Accuracy | Loop over rows, call the model, compare with labels, return accuracy or the label | `pipeline` |

- **Lesson widget:** a ```` ```python-try ```` block that runs editable Python in the browser with the existing Pyodide worker (no model calls, free) and shows stdout and the return value. It is used in lessons 1–3. Lessons 4–5 use normal code blocks plus the prompt `try` block.
- Reference solutions must pass all tests:
  - Scratch problems: verified locally with `python3` against the jsonl tests.
  - Pipeline problems: verified against the gateway, keeping the shared rate limit in mind.

## 4. UI polish (whole app)

- **Design tokens** in `globals.css`: a radius scale, an elevation/shadow scale, a focus ring, and motion durations and curves. Both light and dark themes are checked.
- **Consistent building blocks:** buttons (primary, secondary, ghost), cards, badges, tabs, inputs and sliders.
- Icons with consistent stroke and size; use a small icon set and avoid emoji as UI icons.
- **Motion:** subtle and purposeful (tab underline, results reveal, hover lift), and respects `prefers-reduced-motion`.
- **Pages, in priority order:** lesson reading page (typography, Try-it, tokenizer, glossary tooltips) → problem workspace (settings bar, results panel, hints/answer, mobile layout) → home, tracks, contests and `/me`.
- No change to behavior or data flow. All existing functionality keeps working.

## 5. Ownership while building (parallel agents)

| Owner | Files |
|---|---|
| **Data & contest agent** | new `problems/<event problems>/`, `contests/`, `src/lib/contests.ts`, `src/lib/problems/loader.ts` + `schema.ts` (contest-only visibility), `src/lib/tracks.ts` (filtering), data download scripts in the scratchpad |
| **Python track agent** | new `problems/<python problems>/`, `tracks/python-for-ai.yaml`, new `src/components/python-try.tsx`, and the one-line ```` ```python-try ```` hook in `src/components/markdown.tsx` |
| **UI agent** | `src/app/globals.css`, `src/app/layout.tsx`, page files under `src/app/**` (visual changes only), and `src/components/**` except `python-try.tsx` and the markdown fence handling |
| **Lead** | integration, validation runs, spec, final review and build |

## 6. Acceptance

- `npx tsc --noEmit`, `npx eslint .` and `npx next build` pass.
- Every new prompt problem: the reference passes and the starter fails (`npm run check:prompt -- <slugs> --starter`).
- Python problems: reference solutions pass their tests.
- `/contests/data-detective-day` is live, with 4 problems. The contest problems are absent from `/problems` while the contest runs.
- The UI pass is visually consistent in light and dark mode, and usable at a 375px width.
