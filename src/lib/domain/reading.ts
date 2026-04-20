import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { eq, between } from "drizzle-orm";
import { ReadingInput, GlucoseReading } from "./types";
import { computeDayKey } from "@/lib/utils/day-key";
import { logEvent } from "./event-log";
import { startOfWeek, endOfWeek } from "date-fns";

type ReadingUpdate = Partial<Omit<ReadingInput, "measuredAt">> & {
    measuredAt?: Date;
    dayKey?: string;
    updatedAt: Date;
};

export async function createReading(input: ReadingInput): Promise<GlucoseReading> {
    const measuredAt = new Date(input.measuredAt);
    const dayKey = computeDayKey(measuredAt);

    const [reading] = await db
        .insert(glucoseReadings)
        .values({
            ...input,
            measuredAt,
            dayKey,
        })
        .returning();

    await logEvent("create", "glucose_reading", reading.id, { value: reading.valueMmolL });

    return reading;
}

export async function updateReading(id: string, input: Partial<ReadingInput>): Promise<GlucoseReading> {
    const updateData: ReadingUpdate = { ...input, updatedAt: new Date() };

    if (input.measuredAt) {
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
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    const startDayKey = computeDayKey(start);
    const endDayKey = computeDayKey(end);

    return db
        .select()
        .from(glucoseReadings)
        .where(between(glucoseReadings.dayKey, startDayKey, endDayKey))
        .orderBy(glucoseReadings.measuredAt);
}

export async function listReadingsByDayKeyRange(startDayKey: string, endDayKey: string): Promise<GlucoseReading[]> {
    return db
        .select()
        .from(glucoseReadings)
        .where(between(glucoseReadings.dayKey, startDayKey, endDayKey))
        .orderBy(glucoseReadings.measuredAt);
}
