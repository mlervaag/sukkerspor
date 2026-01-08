import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { BackupData } from "./schema";
import { logEvent } from "../domain/event-log";
import { GlucoseReading } from "../domain/types";

export async function exportBackup(): Promise<BackupData> {
    const readings = await db.select().from(glucoseReadings).orderBy(glucoseReadings.measuredAt);

    const backup: BackupData = {
        schema_version: 1,
        exported_at: new Date().toISOString(),
        readings: readings as any as GlucoseReading[],
        settings: {
            // Placeholder for future settings
        },
    };

    await logEvent("export", "backup", undefined, {
        count: readings.length,
    });

    return backup;
}
