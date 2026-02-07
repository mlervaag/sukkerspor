import { BackupData } from "./schema";

export function validateBackup(data: any): BackupData {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid backup format: Not an object");
    }

    if (data.schema_version !== 1 && data.schema_version !== 2) {
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

    // Validate insulin doses if present (v2)
    if (data.insulin_doses) {
        if (!Array.isArray(data.insulin_doses)) {
            throw new Error("Invalid backup format: insulin_doses must be an array");
        }
        for (const d of data.insulin_doses) {
            const id = d.id;
            const administeredAt = d.administeredAt || d.administered_at;
            const doseUnits = d.doseUnits ?? d.dose_units;

            if (!id || !administeredAt || (typeof doseUnits !== "number" && typeof doseUnits !== "string")) {
                throw new Error(`Invalid insulin dose data in backup: ${JSON.stringify(d)}`);
            }
        }
    }

    return data as BackupData;
}
