import { BackupData } from "./schema";

function isValidDate(value: unknown): boolean {
    if (!value) return false;
    if (value instanceof Date) return !isNaN(value.getTime());
    if (typeof value !== "string" && typeof value !== "number") return false;
    const d = new Date(value);
    return !isNaN(d.getTime());
}

export function validateBackup(data: unknown): BackupData {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid backup format: Not an object");
    }

    const obj = data as Record<string, unknown>;

    if (obj.schema_version !== 1 && obj.schema_version !== 2) {
        throw new Error(`Unsupported schema version: ${obj.schema_version}`);
    }

    if (!Array.isArray(obj.readings)) {
        throw new Error("Invalid backup format: Missing readings array");
    }

    // Accept both camelCase (current export) and snake_case (legacy) keys.
    for (const item of obj.readings) {
        const r = item as Record<string, unknown>;
        const id = r.id;
        const measuredAt = r.measuredAt ?? r.measured_at;
        const valueMmolL = r.valueMmolL ?? r.value_mmol_l;

        if (!id || (typeof valueMmolL !== "number" && typeof valueMmolL !== "string")) {
            throw new Error(`Invalid reading data in backup: ${JSON.stringify(item)}`);
        }
        if (!isValidDate(measuredAt)) {
            throw new Error(`Invalid reading data in backup: missing or invalid measuredAt (${JSON.stringify(item)})`);
        }
    }

    if (obj.insulin_doses !== undefined) {
        if (!Array.isArray(obj.insulin_doses)) {
            throw new Error("Invalid backup format: insulin_doses must be an array");
        }
        for (const item of obj.insulin_doses) {
            const d = item as Record<string, unknown>;
            const id = d.id;
            const administeredAt = d.administeredAt ?? d.administered_at;
            const doseUnits = d.doseUnits ?? d.dose_units;

            if (!id || (typeof doseUnits !== "number" && typeof doseUnits !== "string")) {
                throw new Error(`Invalid insulin dose data in backup: ${JSON.stringify(item)}`);
            }
            if (!isValidDate(administeredAt)) {
                throw new Error(`Invalid insulin dose data in backup: missing or invalid administeredAt (${JSON.stringify(item)})`);
            }
        }
    }

    return obj as unknown as BackupData;
}
