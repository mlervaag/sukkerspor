import { db } from "@/lib/db";
import { glucoseReadings, userSettings } from "@/lib/db/schema";
import { BackupData } from "./schema";
import { logEvent } from "../domain/event-log";
import { eq } from "drizzle-orm";


/**
 * Destructive import: Deletes all existing readings and replaces them with backup data.
 * Performed within a single transaction.
 */
export async function importBackup(data: BackupData): Promise<void> {
    await db.transaction(async (tx) => {
        // Clear existing readings
        await tx.delete(glucoseReadings);

        // Insert readings from backup
        if (data.readings.length > 0) {
            // Map backup readings back to DB schema format
            const valuesToInsert = data.readings.map((r: any) => ({
                id: r.id,
                measuredAt: new Date(r.measuredAt || r.measured_at),
                dayKey: r.dayKey || r.day_key,
                valueMmolL: r.valueMmolL || r.value_mmol_l,
                isFasting: r.isFasting ?? r.is_fasting,
                isPostMeal: r.isPostMeal ?? r.is_post_meal,
                mealType: r.mealType || r.meal_type,
                foodText: r.foodText || r.food_text,
                feelingNotes: r.feelingNotes || r.feeling_notes,
                createdAt: r.createdAt ? new Date(r.createdAt) : (r.created_at ? new Date(r.created_at) : undefined),
                updatedAt: r.updatedAt ? new Date(r.updatedAt) : (r.updated_at ? new Date(r.updated_at) : undefined),
            }));

            await tx.insert(glucoseReadings).values(valuesToInsert as any);
        }

        // Restore settings if present
        if (data.settings) {
            await tx.update(userSettings)
                .set({
                    reportLanguage: data.settings.report_language || "no",
                    dueDate: data.settings.due_date ? new Date(data.settings.due_date) : null,
                    diagnosisDate: data.settings.diagnosis_date ? new Date(data.settings.diagnosis_date) : null,
                    notes: data.settings.notes || null,
                    updatedAt: new Date(),
                })
                .where(eq(userSettings.id, "singleton"));
        }

        await logEvent("import", "backup", undefined, {
            count: data.readings.length,
            version: data.schema_version,
        });
    });
}
