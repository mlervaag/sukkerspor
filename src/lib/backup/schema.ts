import { GlucoseReading, InsulinDose } from "../domain/types";

export interface BackupData {
    schema_version: 1 | 2;
    exported_at: string;
    readings: GlucoseReading[];
    insulin_doses?: InsulinDose[];
    settings: {
        report_language?: string;
        due_date?: string;
        diagnosis_date?: string;
        notes?: string;
    };
}
