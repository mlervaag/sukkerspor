import { pgTable, uuid, timestamp, numeric, boolean, text } from "drizzle-orm/pg-core";

export const glucoseReadings = pgTable("glucose_readings", {
    id: uuid("id").primaryKey().defaultRandom(),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    dayKey: text("day_key").notNull(), // YYYY-MM-DD in Europe/Oslo
    valueMmolL: numeric("value_mmol_l", { precision: 4, scale: 1 }).notNull(),
    isFasting: boolean("is_fasting").default(false).notNull(),
    isPostMeal: boolean("is_post_meal").default(false).notNull(),
    mealType: text("meal_type"), // breakfast, lunch, dinner, evening_meal, snack
    partOfDay: text("part_of_day"), // morning, midday, afternoon, evening
    foodText: text("food_text"),
    feelingNotes: text("feeling_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const eventLog = pgTable("event_log", {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(), // create, update, delete, etc.
    entityType: text("entity_type").notNull(), // glucose_reading, etc.
    entityId: uuid("entity_id"),
    payload: text("payload"), // minimal safe payload
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
