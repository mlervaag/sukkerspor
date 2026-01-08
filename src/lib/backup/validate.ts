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
    // Accept both camelCase (current export) and snake_case (legacy) keys
    for (const r of data.readings) {
        const id = r.id;
        const measuredAt = r.measuredAt || r.measured_at;
        const valueMmolL = r.valueMmolL ?? r.value_mmol_l;

        if (!id || !measuredAt || (typeof valueMmolL !== "number" && typeof valueMmolL !== "string")) {
            throw new Error(`Invalid reading data in backup: ${JSON.stringify(r)}`);
        }
    }

    return data as BackupData;
}
