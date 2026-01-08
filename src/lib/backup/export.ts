import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { BackupData } from "./schema";
import { logEvent } from "../domain/event-log";
import { GlucoseReading } from "../domain/types";
import { getSettings } from "../domain/settings";

export async function exportBackup(): Promise<BackupData> {
    const readings = await db.select().from(glucoseReadings).orderBy(glucoseReadings.measuredAt);
    const settings = await getSettings();

    const backup: BackupData = {
        schema_version: 1,
        exported_at: new Date().toISOString(),
        readings: readings as any as GlucoseReading[],
        settings: {
            report_language: settings.reportLanguage,
            due_date: settings.dueDate?.toISOString(),
            diagnosis_date: settings.diagnosisDate?.toISOString(),
            notes: settings.notes || undefined,
        },
    };

    await logEvent("export", "backup", undefined, {
        count: readings.length,
    });

    return backup;
}
