CREATE TABLE IF NOT EXISTS "event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "glucose_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"day_key" text NOT NULL,
	"value_mmol_l" numeric(4, 1) NOT NULL,
	"is_fasting" boolean DEFAULT false NOT NULL,
	"is_post_meal" boolean DEFAULT false NOT NULL,
	"meal_type" text,
	"part_of_day" text,
	"food_text" text,
	"feeling_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
