import { db } from "@/lib/db";
import { glucoseReadings, insulinDoses, userSettings } from "@/lib/db/schema";
import { BackupData } from "./schema";
import { logEvent } from "../domain/event-log";
import { eq } from "drizzle-orm";


/**
 * Destructive import: Deletes all existing readings and replaces them with backup data.
 * Performed within a single transaction for atomicity.
 */
export async function importBackup(data: BackupData): Promise<void> {
    await db.transaction(async (tx) => {
        // Clear existing data
        await tx.delete(insulinDoses);
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

        // Restore settings if present (use upsert in case singleton doesn't exist)
        if (data.settings) {
            await tx.insert(userSettings)
                .values({
                    id: "singleton",
                    reportLanguage: data.settings.report_language || "no",
                    dueDate: data.settings.due_date ? new Date(data.settings.due_date) : null,
                    diagnosisDate: data.settings.diagnosis_date ? new Date(data.settings.diagnosis_date) : null,
                    notes: data.settings.notes || null,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: userSettings.id,
                    set: {
                        reportLanguage: data.settings.report_language || "no",
                        dueDate: data.settings.due_date ? new Date(data.settings.due_date) : null,
                        diagnosisDate: data.settings.diagnosis_date ? new Date(data.settings.diagnosis_date) : null,
                        notes: data.settings.notes || null,
                        updatedAt: new Date(),
                    },
                });
        }

        // Insert insulin doses from backup (v2+)
        if (data.insulin_doses && data.insulin_doses.length > 0) {
            const dosesToInsert = data.insulin_doses.map((d: any) => ({
                id: d.id,
                administeredAt: new Date(d.administeredAt || d.administered_at),
                dayKey: d.dayKey || d.day_key,
                doseUnits: d.doseUnits || d.dose_units,
                insulinType: d.insulinType || d.insulin_type,
                insulinName: d.insulinName || d.insulin_name || null,
                mealContext: d.mealContext || d.meal_context || null,
                notes: d.notes || null,
                createdAt: d.createdAt ? new Date(d.createdAt) : (d.created_at ? new Date(d.created_at) : undefined),
                updatedAt: d.updatedAt ? new Date(d.updatedAt) : (d.updated_at ? new Date(d.updated_at) : undefined),
            }));

            await tx.insert(insulinDoses).values(dosesToInsert as any);
        }

        await logEvent("import", "backup", undefined, {
            readingCount: data.readings.length,
            insulinDoseCount: data.insulin_doses?.length || 0,
            version: data.schema_version,
        });
    });
}
