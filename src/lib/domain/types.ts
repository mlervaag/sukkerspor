import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { glucoseReadings, userSettings } from "@/lib/db/schema";

export type GlucoseReading = InferSelectModel<typeof glucoseReadings>;
export type NewGlucoseReading = InferInsertModel<typeof glucoseReadings>;

export type ReadingInput = Omit<NewGlucoseReading, "id" | "dayKey" | "createdAt" | "updatedAt">;

export type UserSettings = InferSelectModel<typeof userSettings>;
export type NewUserSettings = InferInsertModel<typeof userSettings>;
export type UserSettingsInput = Omit<NewUserSettings, "id" | "updatedAt">;

