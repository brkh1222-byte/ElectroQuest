import {
  boolean,
  date,
  index,
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
// stores everything users generate. Discussions, contests, certificates and authoring come next.

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
    score: real("score").notNull(),
    tokens: integer("tokens").notNull().default(0),
    accepted: boolean("accepted").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("submissions_user_problem_idx").on(t.userId, t.problemSlug)],
);

// Best result per (problem, user), feeding the two leaderboards (spec §4).
export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    problemSlug: text("problem_slug").notNull(),
    userId: text("user_id").notNull(),
    bestScore: real("best_score").notNull(),
    // Fewest tokens among Accepted submissions; null until accepted.
    bestTokens: integer("best_tokens"),
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
