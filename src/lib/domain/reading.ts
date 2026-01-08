import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { eq, and, between } from "drizzle-orm";
import { ReadingInput, GlucoseReading } from "./types";
import { computeDayKey } from "@/lib/utils/day-key";
import { logEvent } from "./event-log";
import { startOfWeek, endOfWeek } from "date-fns";

export async function createReading(input: ReadingInput): Promise<GlucoseReading> {
    // Convert string measuredAt to Date for Drizzle timestamp column
    const measuredAt = new Date(input.measuredAt);
    const dayKey = computeDayKey(measuredAt);

    const [reading] = await db
        .insert(glucoseReadings)
        .values({
            ...input,
            measuredAt, // Use Date object, not the raw string
            dayKey,
        })
        .returning();

    await logEvent("create", "glucose_reading", reading.id, { value: reading.valueMmolL });

    return reading;
}

export async function updateReading(id: string, input: Partial<ReadingInput>): Promise<GlucoseReading> {
    const updateData: any = { ...input, updatedAt: new Date() };

    if (input.measuredAt) {
        // Convert string measuredAt to Date for Drizzle timestamp column
        const measuredAt = new Date(input.measuredAt);
        updateData.measuredAt = measuredAt;
        updateData.dayKey = computeDayKey(measuredAt);
    }

    const [reading] = await db
        .update(glucoseReadings)
        .set(updateData)
        .where(eq(glucoseReadings.id, id))
        .returning();

    await logEvent("update", "glucose_reading", reading.id, { value: reading.valueMmolL });

    return reading;
}

export async function listReadingsByDayKey(dayKey: string): Promise<GlucoseReading[]> {
    return db
        .select()
        .from(glucoseReadings)
        .where(eq(glucoseReadings.dayKey, dayKey))
        .orderBy(glucoseReadings.measuredAt);
}

export async function listReadingsByWeek(date: Date): Promise<GlucoseReading[]> {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // ISO week starts on Monday
    const end = endOfWeek(date, { weekStartsOn: 1 });

    return db
        .select()
        .from(glucoseReadings)
        .where(between(glucoseReadings.measuredAt, start, end))
        .orderBy(glucoseReadings.measuredAt);
}
