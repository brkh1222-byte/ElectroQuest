# AI Playground — "LeetCode for AI Development" — Spec

**Hackathon theme:** Fine-tuning for the Future: equal access to education & skills
**Timeline:** 2 weeks, large team, production-quality build
**Name:** EvalQuest (learner SDK module: `evalquest`)

---

## 1. Problem & pitch

- LeetCode lets anyone practice programming by solving problems. Kaggle is a playground for ML and data science. **No equivalent exists for AI development**: prompting, building LLM pipelines (RAG, tools, agents), understanding model internals, and fine-tuning concepts.
- AI-building skills are becoming core job skills, but learning them usually means paid courses, API keys and GPUs. That excludes the people the theme is about.
- **Our product:** a free, problem-based platform where anyone, from people who can't code to developers upskilling, learns AI development by solving graded problems. There are no API keys or GPUs to arrange, and the platform covers inference costs.
- **Theme framing:** "fine-tuning people for the AI future". The platform also teaches fine-tuning concepts directly through browser-sized problems (see §3.4).

## 2. Users

One ladder covering the full range:

| Learner | Entry point |
|---|---|
| Can't code at all | Prompt-engineering problems (no code), lesson→problem pairs |
| Codes a bit, new to AI | Easy pipeline problems using the simple `evalquest` SDK |
| Developers upskilling | Hard pipeline problems (OpenAI-compatible client), from-scratch implementations, fine-tuning concept problems |

English only for v1.

## 3. Problem types (the unit of work)

All types share **one judge model**: run the submission on test cases → compute a metric → Accepted if ≥ threshold.

### 3.1 Prompt engineering (no code)
- The learner submits a **system prompt** (plus optional few-shot examples) for a fixed model.
- Example: "Classify 50 support tickets into bug/billing/feature with ≥ 90% accuracy."
- **Fully secret grading:** the prompt is sent to the server, which runs the hidden cases and scores them. Hidden inputs never reach the client.

### 3.2 Build an AI pipeline (Python + LLM)
- The learner submits **Python code** implementing a given function signature, e.g. `answer(question, docs) -> str`. The code runs in the browser (Pyodide) and calls LLMs through the platform proxy.
- Examples: RAG over given documents, structured extraction, tool-calling agent, refusal when an answer is unsupported.
- **Partially secret grading:** hidden *inputs* are streamed to the browser at runtime. **Expected outputs and scoring stay server-side.** The learner's outputs are posted back and scored on the server.

### 3.3 Implement from scratch (NumPy)
- The learner submits **Python/NumPy code**: softmax, attention, BPE tokenizer, backprop for a tiny MLP, etc.
- Deterministic unit tests that run fully in the browser.
- **Tests ship to the client, so leaks are accepted.** These problems have pass/fail only and **no leaderboard**.

### 3.4 Fine-tuning concept problems (browser-sized)
- They cover the theme without GPUs:
  - Curate or clean a small dataset so a tiny model trained in-browser beats a baseline.
  - Choose hyperparameters (learning rate, epochs, regularization) for a tiny NumPy model.
  - Implement a LoRA-style low-rank update on a toy layer.
  - Diagnose overfitting from loss curves, or split train/val correctly.
- Training runs in Pyodide on toy-scale models. Grading is deterministic where possible, otherwise by metric threshold.
- A real GPU fine-tuning track is post-v1.

### 3.5 Content target at launch
**About 30 problems**, roughly 10 per main type (prompt / pipeline / from-scratch), with the fine-tuning concept problems spread across them. Enough to fill 2–3 tracks.

## 4. Grading & leaderboards

- **Accepted** = metric on the hidden set ≥ the problem's threshold (accuracy, F1, exact-match, or a custom scorer per problem). LLM calls during grading use temperature 0.
- **Two separate leaderboards per problem** (prompt and pipeline problems only):
  1. **Most accurate:** ranked by the task metric.
  2. **Most efficient:** among Accepted submissions, ranked by total tokens used on the hidden set.
- No LLM-as-judge in v1. Scorers are deterministic functions.
- Run vs Submit:
  - **Run:** visible example tests only. Results show input / expected / actual for each case.
  - **Submit:** hidden tests. Only Submit counts toward Accepted, leaderboards, streaks and the profile.

## 5. Models & the LLM API

- **Fixed model per problem by default**, so everyone is compared on skill. Some problems are **"open model"**: the learner picks from a menu and the token cost matters (an efficiency lesson).
- All models are small and cheap, served through **Vercel AI Gateway**. The platform pays for everything.
- Learner code has two ways to call models (both go through our proxy, and **no keys ever reach the client**):
  - **`evalquest` SDK** (beginner): `from evalquest import llm, embed` → `llm.chat(messages, model=None)`, `embed(texts)`. Usage is logged per run.
  - **OpenAI-compatible endpoint** (advanced): the real `openai` client pointed at our base URL with a short-lived, per-run session token.
- The proxy enforces: problem-allowed models, max tokens per call, per-run call caps, quota, and auth.

## 6. Execution architecture

- **All learner code runs in the browser** via **Pyodide in a Web Worker**:
  - It doesn't freeze the UI, and we can enforce timeouts (terminate the worker on timeout).
  - NumPy is preloaded. Other packages are lazy-loaded from an allowlist.
  - Pyodide assets are cached by a service worker for repeat visits.
- Server responsibilities:
  - Auth, quota and rate limiting.
  - The LLM proxy (AI Gateway).
  - Holding hidden test **inputs** (streamed per Submit) and **expected outputs** (never sent).
  - Scoring, leaderboard writes, streaks, profiles.
- Submit flow for a pipeline problem:
  1. Client requests a Submit session → server checks quota and returns a session id plus a session token for the LLM proxy.
  2. Client fetches hidden inputs one at a time (or in a batch) for that session.
  3. The worker runs the learner's function. LLM calls go through the proxy and are tagged with the session (so tokens get counted).
  4. Client posts the outputs → server scores them against the expected outputs, then records the result and token totals.
  5. Server-measured token usage (not client-reported) feeds the efficiency leaderboard.
- Submit flow for a prompt problem: client posts the prompt → server runs all hidden cases → returns the aggregate score plus details for failed cases (with limited detail for hidden cases, e.g. only the first failure's input).
- Accepted integrity gaps:
  - Pipeline hidden inputs can be scraped and hand-labelled. Mitigation: rotate hidden sets periodically.
  - From-scratch tests are fully visible. Mitigation: no leaderboard for those problems.

## 7. Quotas & access

- **Anonymous visitors:** browse everything (problems, lessons, tracks, leaderboards, discussions). They can Run **from-scratch** problems (free, in-browser) but **not** LLM problems.
- **Logged-in users:** Run and Submit everything, subject to a **daily submission-count quota**. Proposed defaults (open question):
  - 50 Runs per day for LLM problems
  - 15 Submits per day for LLM problems
  - From-scratch problems are unlimited
- Quota is shown in the UI. It resets at 00:00 UTC.
- Abuse protection: rate limits at the proxy, BotID on auth and submit endpoints, per-account token ceiling as a backstop.

## 8. Content structure

- **The problem bank is primary:** a LeetCode-style list filterable by type, difficulty (Easy/Medium/Hard), skill tags (prompting, RAG, agents, embeddings, ML math, fine-tuning), status (solved/attempted), and model.
- **Tracks:** ordered collections, e.g. "Prompting 101" (no code), "Build a RAG App", "Transformers from Scratch", "Fine-tuning Fundamentals".
- **Lesson → problem pairs:** a short lesson page (text plus examples, optionally interactive) placed before selected problems, mainly in beginner tracks.

## 9. Problem page UX

- LeetCode-style split layout:
  - **Left:** tabs for statement / hints / discussion / submissions / leaderboard.
  - **Right:** editor and a test panel.
- **Prompt problems:**
  - **Editor tab:** system prompt editor plus few-shot example editor. The test table below shows each case's input / expected / actual, coloured by pass/fail.
  - **Scratch chat tab:** chat freely with the configured model to try the prompt. It counts against Run quota.
- **Code problems:** Monaco editor (Python), starter code, a console with stdout and errors, and a test table.
- **Help system** (no AI tutor in v1):
  - **Tiered hints:** Hint 1 → 2 → 3 → editorial. Unlocking the editorial is recorded on the profile.
  - **Failure explanations:** for a failed visible case, show the diff plus an AI-generated explanation of the likely cause. It uses a cheap model, is cached per (problem, failure signature) and doesn't count against quota.
  - **Community discussion:** per-problem threads. The solutions tab unlocks after Accepted.
- Mobile: prompt problems should be usable on a phone. Code problems are desktop-first.

## 10. Engagement

- **Public profile + skill radar:** solved counts per skill tag, Accepted history, leaderboard placements. Designed as a shareable portfolio for job seekers.
- **Streaks + daily problem:** streak calendar, plus one featured problem per day.
- **Contests:** weekly timed contests on prompt and pipeline problems with fresh hidden sets. Live leaderboard, final ranking. Hidden sets are used once and then retired into the bank.
- **Certificates:** a verifiable completion certificate per track with a public verify URL. **This is the first thing cut if we slip.**

## 11. Problem authoring & QA

- **Problem = folder** (versioned in the repo and synced to the DB):
  ```
  problems/<slug>/
    problem.yaml       # type, difficulty, tags, model(s), threshold, metric, limits
    statement.md
    lesson.md          # optional
    hints.md           # tiered hints + editorial
    starter.py | starter_prompt.md
    tests/visible.jsonl
    tests/hidden.jsonl # never shipped to the client (except from-scratch)
    scorer.py | scorer.ts
    reference/         # reference solution
  ```
- **AI-assisted generation (primary):** an internal pipeline where an LLM drafts the statement, cases and reference solution, then humans review.
- **Community submissions:** an authoring UI that produces the same folder format, plus a moderation queue. Approved problems are published by the core team.
- **Label QA = multi-model agreement:** each test case is labelled independently by several models. Cases where they disagree go to human review before publishing.

## 12. Tech stack

- **Next.js (App Router) on Vercel:** Node runtime, Fluid Compute.
- **Neon Postgres + Drizzle ORM:** users, problems metadata, submissions, sessions, quotas, leaderboards, discussions, contests, streaks.
- **Clerk** for auth (via Vercel Marketplace).
- **Vercel AI Gateway** behind our proxy route. AI SDK on the server.
- **Pyodide** in a Web Worker. **Monaco** editor.
- Hidden test data is stored server-side (DB or private Blob) and never included in client bundles.
- Rate limiting and caching: Upstash Redis (Marketplace) for quota counters and the failure-explanation cache.

### Core data model (sketch)
- `users`, `profiles`
- `problems` (+ versions), `tracks`, `track_items`, `lessons`
- `submissions` (user, problem, version, kind: run/submit, code_or_prompt, score, tokens, accepted, created_at)
- `submit_sessions` (id, user, problem, token, expires_at, status)
- `leaderboard_entries` (problem, user, best_accuracy, best_tokens)
- `quota_usage` (user, date, runs, submits)
- `discussions`, `posts`
- `contests`, `contest_problems`, `contest_entries`
- `streaks`, `daily_problems`
- `certificates`
- `problem_drafts`, `reviews`, `label_disagreements`

## 13. Scope & cut order

All of the following are in scope for the 2-week build:
- Problem bank, all problem types, Run/Submit, two leaderboards
- Tracks, lessons, hints, failure explanations, discussions
- Profiles, skill radar, streaks, contests
- Community submissions, AI-assisted authoring, label QA
- About 30 problems

**Cut order if behind:** certificates (first). The team should agree on a second and third cut. Suggested: community submission UI → contests.

## 14. Open questions

1. Final product name.
2. Exact quota numbers, and whether contests get a separate quota.
3. Which small models to fix per problem (cost per hidden-set run × expected daily Submits = budget).
4. How often to rotate hidden sets for pipeline problems.
5. How much hidden-case detail to reveal on a failed Submit for prompt problems (more detail helps learning but leaks the set).
6. Sustainability after the hackathon: sponsorship or grants versus a paid tier, while keeping core learning free.
7. The Pyodide package allowlist for pipeline problems (e.g. `numpy`, `scikit-learn` for retrieval baselines?).
