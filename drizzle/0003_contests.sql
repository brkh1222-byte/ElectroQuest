CREATE TABLE "contest_entries" (
	"contest_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contest_entries_contest_slug_user_id_pk" PRIMARY KEY("contest_slug","user_id")
);
