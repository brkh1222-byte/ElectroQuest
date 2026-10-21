DROP INDEX "submissions_user_problem_idx";--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD COLUMN "best_score_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD COLUMN "best_tokens_at" timestamp;--> statement-breakpoint
CREATE INDEX "submissions_user_problem_idx" ON "submissions" USING btree ("user_id","problem_slug","created_at");