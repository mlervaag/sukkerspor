import { db } from "@/lib/db";
import { glucoseReadings, insulinDoses, userSettings } from "@/lib/db/schema";
import { BackupData } from "./schema";
import { logEvent } from "../domain/event-log";

type RawBackupReading = Record<string, unknown>;
type RawBackupDose = Record<string, unknown>;

function pickDate(a: unknown, b: unknown): Date | undefined {
    const raw = (a ?? b) as string | Date | undefined;
    if (!raw) return undefined;
    const d = raw instanceof Date ? raw : new Date(raw);
    return isNaN(d.getTime()) ? undefined : d;
}

function requireDate(a: unknown, b: unknown, label: string): Date {
    const d = pickDate(a, b);
    if (!d) {
        throw new Error(`Backup import: ${label} is missing or invalid`);
    }
    return d;
}

function pickString(...values: unknown[]): string | null {
    for (const v of values) {
        if (typeof v === "string" && v !== "") return v;
        if (v === null) return null;
    }
    return null;
}

/**
 * Destructive import: Deletes all existing readings and insulin doses and
 * replaces them with backup data. Performed within a single transaction.
 */
export async function importBackup(data: BackupData): Promise<void> {
    await db.transaction(async (tx) => {
        await tx.delete(insulinDoses);
        await tx.delete(glucoseReadings);

        if (data.readings.length > 0) {
            const valuesToInsert = (data.readings as RawBackupReading[]).map((r) => {
                const measuredAt = requireDate(r.measuredAt, r.measured_at, "reading.measuredAt");
                const valueMmolL = (r.valueMmolL ?? r.value_mmol_l) as string | number;
                return {
                    id: r.id as string,
                    measuredAt,
                    dayKey: (r.dayKey ?? r.day_key) as string,
                    valueMmolL: typeof valueMmolL === "number" ? valueMmolL.toString() : valueMmolL,
                    isFasting: Boolean(r.isFasting ?? r.is_fasting),
                    isPostMeal: Boolean(r.isPostMeal ?? r.is_post_meal),
                    mealType: pickString(r.mealType, r.meal_type),
                    foodText: pickString(r.foodText, r.food_text),
                    feelingNotes: pickString(r.feelingNotes, r.feeling_notes),
                    createdAt: pickDate(r.createdAt, r.created_at),
                    updatedAt: pickDate(r.updatedAt, r.updated_at),
                };
            });

            await tx.insert(glucoseReadings).values(valuesToInsert);
        }

        if (data.settings) {
            const settingsValues = {
                id: "singleton",
                reportLanguage: data.settings.report_language || "no",
                dueDate: data.settings.due_date ? new Date(data.settings.due_date) : null,
                diagnosisDate: data.settings.diagnosis_date ? new Date(data.settings.diagnosis_date) : null,
                notes: data.settings.notes || null,
                updatedAt: new Date(),
            };
            await tx.insert(userSettings)
                .values(settingsValues)
                .onConflictDoUpdate({ target: userSettings.id, set: settingsValues });
        }

        if (data.insulin_doses && data.insulin_doses.length > 0) {
            const dosesToInsert = (data.insulin_doses as RawBackupDose[]).map((d) => {
                const administeredAt = requireDate(d.administeredAt, d.administered_at, "insulin_dose.administeredAt");
                const doseUnits = (d.doseUnits ?? d.dose_units) as string | number;
                return {
                    id: d.id as string,
                    administeredAt,
                    dayKey: (d.dayKey ?? d.day_key) as string,
                    doseUnits: typeof doseUnits === "number" ? doseUnits.toString() : doseUnits,
                    insulinType: (d.insulinType ?? d.insulin_type) as string,
                    insulinName: pickString(d.insulinName, d.insulin_name),
                    mealContext: pickString(d.mealContext, d.meal_context),
                    notes: pickString(d.notes),
                    createdAt: pickDate(d.createdAt, d.created_at),
                    updatedAt: pickDate(d.updatedAt, d.updated_at),
                };
            });

            await tx.insert(insulinDoses).values(dosesToInsert);
        }

        await logEvent("import", "backup", undefined, {
            readingCount: data.readings.length,
            insulinDoseCount: data.insulin_doses?.length || 0,
            version: data.schema_version,
        });
    });
}
