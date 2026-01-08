import { BackupData } from "./schema";

export function validateBackup(data: any): BackupData {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid backup format: Not an object");
    }

    if (data.schema_version !== 1) {
        throw new Error(`Unsupported schema version: ${data.schema_version}`);
    }

    if (!Array.isArray(data.readings)) {
        throw new Error("Invalid backup format: Missing readings array");
    }

    // Basic structure validation for each reading
    for (const r of data.readings) {
        if (!r.id || !r.measured_at || typeof r.value_mmol_l !== "number") {
            throw new Error(`Invalid reading data in backup: ${JSON.stringify(r)}`);
        }
    }

    return data as BackupData;
}
