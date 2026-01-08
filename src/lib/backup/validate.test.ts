import { describe, it, expect } from "vitest";
import { validateBackup } from "./validate";

describe("validateBackup", () => {
    it("accepts camelCase keys (current export format)", () => {
        const backup = {
            schema_version: 1,
            exported_at: "2026-01-08T12:00:00.000Z",
            readings: [
                {
                    id: "abc-123",
                    measuredAt: "2026-01-08T10:00:00.000Z",
                    valueMmolL: "5.5",
                    dayKey: "2026-01-08",
                    isFasting: true,
                    isPostMeal: false,
                },
            ],
            settings: {},
        };

        const result = validateBackup(backup);
        expect(result).toEqual(backup);
    });

    it("accepts snake_case keys (legacy format)", () => {
        const backup = {
            schema_version: 1,
            exported_at: "2026-01-08T12:00:00.000Z",
            readings: [
                {
                    id: "abc-123",
                    measured_at: "2026-01-08T10:00:00.000Z",
                    value_mmol_l: 5.5,
                    day_key: "2026-01-08",
                    is_fasting: true,
                    is_post_meal: false,
                },
            ],
            settings: {},
        };

        const result = validateBackup(backup);
        expect(result).toEqual(backup);
    });

    it("rejects missing required fields", () => {
        const backup = {
            schema_version: 1,
            exported_at: "2026-01-08T12:00:00.000Z",
            readings: [
                {
                    id: "abc-123",
                    // missing measuredAt and valueMmolL
                },
            ],
            settings: {},
        };

        expect(() => validateBackup(backup)).toThrow("Invalid reading data");
    });

    it("rejects unsupported schema version", () => {
        const backup = {
            schema_version: 999,
            readings: [],
        };

        expect(() => validateBackup(backup)).toThrow("Unsupported schema version");
    });

    it("rejects missing readings array", () => {
        const backup = {
            schema_version: 1,
        };

        expect(() => validateBackup(backup)).toThrow("Missing readings array");
    });
});
