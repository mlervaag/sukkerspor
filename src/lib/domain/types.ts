import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { glucoseReadings, insulinDoses, userSettings } from "@/lib/db/schema";

export type GlucoseReading = InferSelectModel<typeof glucoseReadings>;
export type NewGlucoseReading = InferInsertModel<typeof glucoseReadings>;

export type ReadingInput = Omit<NewGlucoseReading, "id" | "dayKey" | "createdAt" | "updatedAt">;

export type InsulinDose = InferSelectModel<typeof insulinDoses>;
export type NewInsulinDose = InferInsertModel<typeof insulinDoses>;
export type InsulinDoseInput = Omit<NewInsulinDose, "id" | "dayKey" | "createdAt" | "updatedAt">;

export type UserSettings = InferSelectModel<typeof userSettings>;
export type NewUserSettings = InferInsertModel<typeof userSettings>;
export type UserSettingsInput = Omit<NewUserSettings, "id" | "updatedAt">;

