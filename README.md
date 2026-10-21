# EvalQuest

_Team 9 · PineQuest S5 Episode 2 (`pinequest-s5-episode-2-team-9`)_

LeetCode-style practice platform for AI development: prompt engineering, LLM pipelines, and
AI-from-scratch problems. Free for learners: no API keys, no GPUs. Learner code runs in the browser (Pyodide).

Product spec: [`.plans/ai-playground-platform-spec.md`](.plans/ai-playground-platform-spec.md)

## Run locally

```bash
npm install
npx vercel link          # pick the team's "evalquest" project
npx vercel env pull      # writes .env.local: Neon, Clerk, Upstash, AI Gateway (OIDC)
npm run dev
```

Schema changes: edit `src/db/schema.ts`, then `npm run db:generate && npm run db:migrate`.

## How it works

| Problem type | Learner submits | Runs where | Graded where |
|---|---|---|---|
| `prompt` | system prompt | server (LLM) | server; hidden inputs never leave it |
| `pipeline` | Python using `evalquest` SDK | browser (Pyodide worker) | server; expected outputs stay server-side |
| `scratch` | Python/NumPy | browser | browser (tests ship to client, no leaderboard) |

- `public/pyodide-worker.js`: runs learner Python and defines the `evalquest` SDK (`llm.chat`, `embed`, `fixtures`).
  Model calls use synchronous XHR to `/api/llm/*` with a signed per-attempt session token.
- `src/app/api/problems/[slug]/*`: `prompt` (run/submit prompt problems), `chat` (scratch chat),
  `session` + `score` (pipeline attempts).
- `src/lib/llm.ts`: Vercel AI Gateway via AI SDK 7; temperature 0; model allowlist per problem.
- `src/db/`: Drizzle schema for Neon. Writes are skipped until `DATABASE_URL` is set.

## Adding a problem

Create `problems/<slug>/` with:

```
problem.yaml          # type, difficulty, tags, model, metric, threshold, entrypoint, limits
statement.md
lesson.md             # optional beginner lesson shown before the problem (starts with "# Title")
hints.md              # "## Hint 1" … "## Editorial"
starter.py | starter_prompt.md
tests/visible.jsonl   # {"id","input"|"args","expected"}
tests/hidden.jsonl
reference/            # reference solution (must pass before publishing)
fixtures/*.json       # optional data exposed as evalquest.fixtures
```

Prompt problem metrics: `label_accuracy` (whole reply equals the label), `contains_any` (reply contains one of
the expected phrases), `final_answer` (last line equals the answer, so the model can reason first).

Before publishing a prompt problem, check that the reference passes and the starter doesn't:

```bash
npm run check:prompt -- <slug> --starter
```

### Lessons and tracks

A track is `tracks/<slug>.yaml`: `title`, `level`, `summary`, `order`, and an ordered `problems` list. Each problem
with a `lesson.md` gets a lesson page at `/tracks/<track>/<problem>` and a Lesson tab on the problem page.

In a prompt problem's lesson, a ` ```try ` block becomes a live playground (system prompt, a `---` line, then the
message). It calls the problem's model and counts as one Run.

## Infrastructure

- **Auth**: Clerk (`src/proxy.ts`, `src/lib/auth.ts`). Users are copied into `users` on their first recorded submission
  (`src/db/users.ts`); Clerk webhooks to keep them fresh are still TODO.
- **Quota + pipeline sessions**: Upstash Redis (`src/lib/quota.ts`, `src/lib/sessions.ts`).
- **Database**: Neon Postgres via Drizzle; migrations in `drizzle/`.
- Not built yet: discussion UI, profiles, streak UI, contests, certificates, authoring pipeline,
  OpenAI-compatible endpoint, failure explanations.
# EvalQuest
