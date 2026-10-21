import {
  boolean,
  date,
  index,
  jsonb,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Core tables from spec §12. Problem content lives in the repo (problems/<slug>/); the DB
// stores everything users generate. Discussions, certificates and authoring come next.

export const submissionKind = pgEnum("submission_kind", ["run", "submit"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  username: text("username").unique(), // null when the Clerk account has no username
  displayName: text("display_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    problemSlug: text("problem_slug").notNull(),
    kind: submissionKind("kind").notNull(),
    content: text("content").notNull(), // prompt or code
    // Generation settings and model for prompt problems with learner-controlled settings.
    settings: jsonb("settings").$type<{ temperature?: number; maxOutputTokens?: number; model?: string }>(),
    score: real("score").notNull(),
    tokens: integer("tokens").notNull().default(0),
    accepted: boolean("accepted").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("submissions_user_problem_idx").on(t.userId, t.problemSlug, t.createdAt)],
);

// Best result per (problem, user), feeding the two leaderboards (spec §4).
export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    problemSlug: text("problem_slug").notNull(),
    userId: text("user_id").notNull(),
    bestScore: real("best_score").notNull(),
    // When best_score was first reached; earlier wins ties.
    bestScoreAt: timestamp("best_score_at").defaultNow().notNull(),
    // Fewest tokens among Accepted submissions; null until accepted.
    bestTokens: integer("best_tokens"),
    bestTokensAt: timestamp("best_tokens_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.problemSlug, t.userId] }),
    index("leaderboard_accuracy_idx").on(t.problemSlug, t.bestScore),
    index("leaderboard_tokens_idx").on(t.problemSlug, t.bestTokens),
  ],
);

export const streakDays = pgTable(
  "streak_days",
  {
    userId: text("user_id").notNull(),
    day: date("day").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

// "Show answer" reveals (beginner curriculum spec §4.4). A reveal keeps solves but drops the
// learner from that problem's leaderboard.
export const answerReveals = pgTable(
  "answer_reveals",
  {
    userId: text("user_id").notNull(),
    problemSlug: text("problem_slug").notNull(),
    revealedAt: timestamp("revealed_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.problemSlug] })],
);

// Contest sign-ups. Contests themselves live in the repo (contests/<slug>.yaml), and scores are
// computed from Accepted Submits inside the contest window, so this is all contests store.
export const contestEntries = pgTable(
  "contest_entries",
  {
    contestSlug: text("contest_slug").notNull(),
    userId: text("user_id").notNull(),
    // Only Submits made after this count toward the contest.
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.contestSlug, t.userId] })],
);
