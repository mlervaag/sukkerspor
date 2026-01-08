import { describe, it, expect } from "vitest";

// Replicating the logic used in the API route for verification
function transformSettingsInput(input: any) {
    return {
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === "" ? null : input.dueDate,
        diagnosisDate: input.diagnosisDate ? new Date(input.diagnosisDate) : input.diagnosisDate === "" ? null : input.diagnosisDate,
    };
}

describe("Settings Date Transformation", () => {
    it("converts ISO strings to Date objects", () => {
        const input = { dueDate: "2024-01-01", diagnosisDate: "2023-12-31" };
        const result = transformSettingsInput(input);
        expect(result.dueDate).toBeInstanceOf(Date);
        expect(result.diagnosisDate).toBeInstanceOf(Date);
        expect(result.dueDate?.toISOString()).toContain("2024-01-01");
    });

    it("converts empty strings to null", () => {
        const input = { dueDate: "", diagnosisDate: "" };
        const result = transformSettingsInput(input);
        expect(result.dueDate).toBeNull();
        expect(result.diagnosisDate).toBeNull();
    });

    it("leaves undefined as undefined", () => {
        const input = { notes: "foo" };
        const result = transformSettingsInput(input);
        expect(result.dueDate).toBeUndefined();
        expect(result.diagnosisDate).toBeUndefined();
    });
});
