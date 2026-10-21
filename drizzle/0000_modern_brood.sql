CREATE TYPE "public"."submission_kind" AS ENUM('run', 'submit');--> statement-breakpoint
CREATE TABLE "leaderboard_entries" (
	"problem_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"best_score" real NOT NULL,
	"best_tokens" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_entries_problem_slug_user_id_pk" PRIMARY KEY("problem_slug","user_id")
);
--> statement-breakpoint
CREATE TABLE "streak_days" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	CONSTRAINT "streak_days_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"kind" "submission_kind" NOT NULL,
	"content" text NOT NULL,
	"score" real NOT NULL,
	"tokens" integer DEFAULT 0 NOT NULL,
	"accepted" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text,
	"display_name" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "leaderboard_accuracy_idx" ON "leaderboard_entries" USING btree ("problem_slug","best_score");--> statement-breakpoint
CREATE INDEX "leaderboard_tokens_idx" ON "leaderboard_entries" USING btree ("problem_slug","best_tokens");--> statement-breakpoint
CREATE INDEX "submissions_user_problem_idx" ON "submissions" USING btree ("user_id","problem_slug");