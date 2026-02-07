import { db } from "@/lib/db";
import { insulinDoses } from "@/lib/db/schema";
import { eq, between } from "drizzle-orm";
import { InsulinDoseInput, InsulinDose } from "./types";
import { computeDayKey } from "@/lib/utils/day-key";
import { logEvent } from "./event-log";

export async function createInsulinDose(input: InsulinDoseInput): Promise<InsulinDose> {
    const administeredAt = new Date(input.administeredAt);
    const dayKey = computeDayKey(administeredAt);

    const [dose] = await db
        .insert(insulinDoses)
        .values({
            ...input,
            administeredAt,
            dayKey,
        })
        .returning();

    await logEvent("create", "insulin_dose", dose.id, { units: dose.doseUnits, type: dose.insulinType });

    return dose;
}

export async function updateInsulinDose(id: string, input: Partial<InsulinDoseInput>): Promise<InsulinDose> {
    const updateData: any = { ...input, updatedAt: new Date() };

    if (input.administeredAt) {
        const administeredAt = new Date(input.administeredAt);
        updateData.administeredAt = administeredAt;
        updateData.dayKey = computeDayKey(administeredAt);
    }

    const [dose] = await db
        .update(insulinDoses)
        .set(updateData)
        .where(eq(insulinDoses.id, id))
        .returning();

    await logEvent("update", "insulin_dose", dose.id, { units: dose.doseUnits, type: dose.insulinType });

    return dose;
}

export async function listInsulinDosesByDayKeyRange(startDayKey: string, endDayKey: string): Promise<InsulinDose[]> {
    return db
        .select()
        .from(insulinDoses)
        .where(between(insulinDoses.dayKey, startDayKey, endDayKey))
        .orderBy(insulinDoses.administeredAt);
}
