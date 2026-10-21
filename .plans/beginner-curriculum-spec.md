# Beginner Curriculum Spec: lessons first, problems second

Branch: `beginner-lessons`. Date: 2026-10-21. Builds on `.plans/ai-playground-platform-spec.md` §8 (tracks, lesson → problem pairs).

## 1. Goal

The current product looks like a LeetCode problem bank. This round shifts the focus to people who have **never used AI**. They should learn, from scratch, how to use AI well and how to build with it. Each concept gets a short, beginner-friendly lesson, followed by an easy graded problem.

The problem bank stays, but it becomes secondary. The front door is the learning path.

## 2. Decisions from the interview

| Topic | Decision |
|---|---|
| Model topics to cover | All four: how models behave (tokens, context, temperature, hallucination, cutoff), choosing a model (size, cost, accuracy), how models work inside (next-word prediction, visual and no math), and limits & safety (prompt injection, privacy, bias). |
| Lesson shape | Lesson → problem, always. Every problem has tiered hints **and** an answer. |
| Answer policy | The answer is available **anytime, behind a warning**. Revealing it marks the problem "solved with help" and removes the learner from that problem's leaderboard. |
| Everyday AI use | Used **as scenarios**. Problems stay build-oriented (system prompt + hidden tests), but the examples come from daily life: emails, meeting notes, homework, shop customers. |
| Language | **Simple English**: short sentences, one idea per paragraph, and every term defined the first time it appears. Readers may speak English as a second language. |
| Grading of model concepts | **Prompt problems with settings.** The learner controls settings such as temperature and max output tokens, or picks a model, as part of the solution. There is no new quiz type. |
| New metrics | **Repeat-run consistency** (rewards low temperature) and **token budget** (rewards short output and cheap models). JSON and must-not-contain metrics are out of scope. |
| Tracks | **3 beginner tracks**: *AI Basics* (how models work), *Prompting 101* (expanded), *Prompting 201* (real-world prompting and safety). |
| Volume | **About 15 new lessons** this round. |
| Lesson widgets (default; not confirmed in the interview) | Settings in the Try-it box (temperature, max tokens), a "Run 3×" button that shows randomness, and a local **tokenizer viewer**. No logprobs widget: the provider support is uncertain. |

## 3. Curriculum

Each step is one `problems/<slug>/` folder containing `lesson.md`, `statement.md`, `hints.md` (hints plus an Editorial), `starter_prompt.md`, `reference/prompt.md`, and `tests/{visible,hidden}.jsonl`. Every problem is `difficulty: easy` and uses the `beginner` tag.

### Track 1: AI Basics (`tracks/ai-basics.yaml`, order 1)

"What is this thing and how does it behave?" No code.

| # | Lesson | Problem (slug) | Grading |
|---|---|---|---|
| 1 | What a Language Model Really Does (next-word prediction) | `fill-the-blank`: reply with only the missing word | `label_accuracy` |
| 2 | Tokens: How Models Read Text (tokenizer viewer) | `headline-writer`: a short headline containing the key fact, under a token budget | `contains_any` + `tokenBudget` |
| 3 | Randomness and Temperature (Run 3× demo) | `steady-labels`: classify messages consistently. The learner sets the temperature | `label_accuracy` + `repeat: 3` + learner `temperature` |
| 4 | When Models Make Things Up | `not-sure`: answer general knowledge, but reply "I'm not sure" for the future, private people and made-up things. (`bakery-helpdesk` already covers "answer only from given facts".) | `contains_any` |
| 5 | Big Models, Small Models | `pick-a-model`: count letters in a word. The model menu defaults to `gpt-5-mini` (a reasoning model, ~800 output tokens per answer). The learner switches to `gemini-2.5-flash-lite` and lets it count step by step | `final_answer` + `tokenBudget: 150` + model list (measured with the reference prompt: flash-lite ~30, gemini-2.5-flash ~237, gpt-5-mini ~619 output tokens) |
| 6 | Don't Trust Every Input (prompt injection) | `injection-proof`: classify reviews that contain "ignore your instructions" text | `label_accuracy` |

### Track 2: Prompting 101 (`tracks/prompting-101.yaml`, order 2; existing)

The existing 5 steps stay: review-sentiment, date-finder, ticket-triage, bakery-helpdesk, word-problems. Two new steps are added:

| # | Lesson | Problem | Grading |
|---|---|---|---|
| 6 | Set the Role and the Audience | `jargon-buster`: one plain sentence a 12-year-old understands, containing the key idea, under a token budget | `contains_any` + `tokenBudget` |
| 7 | Separate Instructions from Data | `meeting-owner`: given meeting notes, reply with the name of the person who owns the task | `label_accuracy` |

### Track 3: Prompting 201 (`tracks/prompting-201.yaml`, order 3)

Real-world prompting, still with no code.

| # | Lesson | Problem | Grading |
|---|---|---|---|
| 1 | Write Rules as a Checklist | `refund-check`: apply a 3-condition refund policy and reply `eligible` or `not eligible` | `label_accuracy` |
| 2 | Output a Program Can Read | `contact-card`: extract `Name \| Phone` from a messy message | `label_accuracy` |
| 3 | Keep the Assistant on Topic | `stay-on-topic`: a homework helper that answers maths questions and replies with a fixed refusal to anything else | `contains_any` |
| 4 | Protect Private Information | `redact-pii`: rewrite the text with `[NAME]`, `[PHONE]` and `[EMAIL]` | `label_accuracy` (exact) |
| 5 | Fix a Broken Prompt | `fix-the-prompt`: the starter prompt has 3 bugs; debug it by reading the Run output | `label_accuracy` |
| 6 | Put It All Together (capstone) | `inbox-router`: reply `team \| priority` for company emails | `label_accuracy` |

(`budget-tagger` was dropped: `tokenBudget` measures output tokens only, and a one-word label is always within budget, so it would teach nothing. Token cost is covered by `headline-writer`, `jargon-buster` and `pick-a-model`.)

That is 14 new lessons. A 15th (context window / "the model has no memory") is a stretch goal for AI Basics.

### Writing rules for lessons (simple English)

- Keep sentences short, aiming for about 20 words or fewer. Use active voice.
- **Bold** each new term and define it in the same sentence.
- Every lesson has at least one `try` block. Concept lessons use the new widgets.
- Structure: hook (what goes wrong) → the idea → try it → one "Key idea" callout → how this problem is graded.
- Use everyday scenarios: shop owner, student, office worker, teacher.
- Length: 400–700 words. Expected reading time: 3–5 minutes.
- Each lesson ends by telling the learner exactly what the problem asks.

## 4. Engine changes

### 4.1 Learner-controlled settings (`problem.yaml`)

```yaml
settings:
  temperature: { default: 1, min: 0, max: 1.5 }   # the learner can change it; omit to fix it at 0
  maxOutputTokens: { default: 60, min: 5, max: 200 }  # the learner can change it; omit to fix it at limits.maxOutputTokens
repeat: 3          # each hidden/visible case runs 3 times and passes only if every run passes
tokenBudget: 12    # Accepted also requires average output tokens per call ≤ 12
```

- When a setting is omitted, today's behavior applies: temperature 0 and `limits.maxOutputTokens`.
- The `/prompt` and `/chat` routes accept `settings: { temperature?, maxOutputTokens? }` and `model`. The server clamps each value to the problem's min and max, and ignores any setting the problem doesn't expose.
- `chat()` in `src/lib/llm.ts` takes an optional `temperature`.
- Submissions store the settings and model in a new nullable `submissions.settings` jsonb column (migration `drizzle/0002_beginner_answers.sql`). "Load into editor" restores the prompt together with its settings.
- Workspace: a settings bar above Run/Submit shows a slider for each exposed setting and a model picker for open-model problems.
- Run and Submit report `avgOutputTokens`. When the problem has a budget, the results panel shows "avg 9.5 / 12 tokens".

### 4.2 Repeat-run consistency

- `repeat: N` (default 1) runs each test N times. A case passes only if all N replies pass. Run output shows every reply, so the learner sees the randomness.
- Quota: a Run or Submit still counts as 1 against the daily quota. Repeat problems keep their test sets small (≤ 6 visible, ≤ 8 hidden).

### 4.3 Token budget

- `tokenBudget: B`: `accepted = score ≥ threshold && avgOutputTokens ≤ B`. The score itself is unchanged. The verdict explains the failure, e.g. "Over token budget".

### 4.4 Answers behind a warning

- In the Hints tab, after the hint list, a **Show answer** button opens a confirm: "Try a few more times first? Seeing the answer marks this problem as solved with help and removes you from its leaderboard."
- On confirm, `POST /api/problems/[slug]/answer` records a row in the new table `answer_reveals (user_id, problem_slug, revealed_at)` and returns the reference prompt plus the Editorial. The UI shows both, with a **Load into editor** button. The button uses the existing `loadDraft` event.
- Anonymous users see a sign-in prompt instead, because the reveal is tracked.
- The Editorial no longer appears as a normal hint. The loader splits `## Editorial` out of `hints.md` and only the answer route serves it.
- Submissions made after a reveal are recorded with `ranked: false`, so they don't reach the leaderboard. Track step lists show "Solved with help" in place of "Solved".

### 4.5 Lesson widgets (`src/components/markdown.tsx` code-fence handlers)

- ```` ```try ```` gains optional settings front matter. For example, a first line `@temperature 1.2` sets the temperature, and `@repeat 3` adds a **Run 3×** button that shows the replies side by side.
- ```` ```tokens ```` renders a **tokenizer viewer**: an editable text box with colored token chips and a token count. It runs fully in the browser with the `gpt-tokenizer` package (o200k encoding). The lesson says counts vary a little between models.

### 4.6 Check script

`scripts/check-prompt-problem.ts` honors `settings` (using the reference's settings, declared in `reference/settings.yaml` or the defaults), `repeat`, and `tokenBudget`. It is the publish gate: the reference must pass and the starter must fail.

## 5. UX: lessons first

- **Home page:** the main call to action is "Start learning AI from zero" → `/tracks/ai-basics`. Below it, a "Your learning path" section shows the 3 tracks in order, with step counts and progress for signed-in users. "Browse all problems" becomes a secondary text link.
- **Header nav:** "Learn" (tracks) comes before "Problems".
- **Track page:** a lesson-first step list ("Lesson 3 · Randomness and Temperature" with the problem as the subtitle) and a "Continue" button that jumps to the first unsolved step.
- **Problem bank:** unchanged, plus a banner: "New to AI? Start with the learning path". (A "Beginner" filter chip is deferred: it would make the static page read `searchParams`.)

## 6. Out of scope this round

New problem types (quiz or predict-the-output), LLM-as-judge, JSON and must-not-contain metrics, logprobs widget, Mongolian translation, lessons for pipeline and scratch tracks, certificates.

## 7. Acceptance

- `npm run typecheck` and `npm run lint` pass.
- `npm run check:prompt -- <all new slugs> --starter` passes: references pass and starters fail.
- All 3 tracks render. Every new step has a lesson, ≥ 2 hints, an Editorial, a reference prompt, ≥ 4 visible tests and ≥ 5 hidden tests.
- Answer reveal works end to end, and the reveal row is written in Neon.
- The settings bar changes the model behavior. Measured: the steady-labels reference prompt passes even at temperature 1.5 (12/12, 3 runs each), so the lesson teaches temperature 0 as insurance rather than as the required fix.

## 8. Build order

1. Engine: settings, repeat, token budget (schema, llm, routes, check script, workspace settings bar, results panel).
2. Answer reveal: migration, route, Hints UI, ranked flag.
3. Lesson widgets: Try-it settings and Run 3×, tokenizer viewer.
4. Content: AI Basics → Prompting 101 additions → Prompting 201. Run the check script after each problem.
5. Home page, navigation and track page changes.

## 9. Build notes (2026-10-21)

- The shared grader lives in `src/lib/grade-prompt.ts` and is used by both `/api/problems/[slug]/prompt` and `scripts/check-prompt-problem.ts`, so the check script grades exactly like production.
- The answer is `reference/prompt.md` plus the `## Editorial` section of `hints.md`. The loader no longer sends the Editorial to the browser. A reference may pin its settings in `reference/settings.yaml` (`temperature: 0`, `model: ...`).
- ```` ```try ```` directives (`@temperature`, `@maxTokens`, `@repeat`) only take effect when the problem exposes that setting. The chat route ignores the rest. Authors should use them only on lessons whose problem exposes the setting.
- **Rate limit risk:** the AI Gateway team limit is currently **5 requests/minute** for `gemini-2.5-flash-lite`. One Submit on `steady-labels` makes 24 calls (8 tests × 3 runs). Before launch, raise the gateway limit or the provider tier, or lower `repeat` and the test counts.
