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
hints.md              # "## Hint 1" … "## Editorial"
starter.py | starter_prompt.md
tests/visible.jsonl   # {"id","input"|"args","expected"}
tests/hidden.jsonl
reference/            # reference solution (must pass before publishing)
fixtures/*.json       # optional data exposed as evalquest.fixtures
```

## Infrastructure

- **Auth**: Clerk (`src/proxy.ts`, `src/lib/auth.ts`). Users are copied into `users` on their first recorded submission
  (`src/db/users.ts`); Clerk webhooks to keep them fresh are still TODO.
- **Quota + pipeline sessions**: Upstash Redis (`src/lib/quota.ts`, `src/lib/sessions.ts`).
- **Database**: Neon Postgres via Drizzle; migrations in `drizzle/`.
- Not built yet: tracks, lessons, leaderboard/discussion UI, profiles, streak UI, contests, certificates, authoring pipeline,
  OpenAI-compatible endpoint, failure explanations.
