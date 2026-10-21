CREATE TABLE "answer_reveals" (
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"revealed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "answer_reveals_user_id_problem_slug_pk" PRIMARY KEY("user_id","problem_slug")
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "settings" jsonb;