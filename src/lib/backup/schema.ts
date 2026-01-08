import { GlucoseReading } from "../domain/types";

export interface BackupData {
    schema_version: 1;
    exported_at: string;
    readings: GlucoseReading[];
    settings: {
        report_language?: string;
        due_date?: string;
        diagnosis_date?: string;
        notes?: string;
    };
}
