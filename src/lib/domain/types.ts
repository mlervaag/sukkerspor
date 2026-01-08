import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { glucoseReadings } from "@/lib/db/schema";

export type GlucoseReading = InferSelectModel<typeof glucoseReadings>;
export type NewGlucoseReading = InferInsertModel<typeof glucoseReadings>;

export type ReadingInput = Omit<NewGlucoseReading, "id" | "dayKey" | "createdAt" | "updatedAt">;
