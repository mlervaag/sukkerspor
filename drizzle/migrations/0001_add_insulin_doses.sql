CREATE TABLE IF NOT EXISTS "insulin_doses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"administered_at" timestamp with time zone NOT NULL,
	"day_key" text NOT NULL,
	"dose_units" numeric(4, 1) NOT NULL,
	"insulin_type" text NOT NULL,
	"insulin_name" text,
	"meal_context" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
