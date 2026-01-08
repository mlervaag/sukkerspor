import { describe, it, expect } from "vitest";
import { getOverviewQueryDate } from "./query-params";
import { startOfDay, subDays } from "date-fns";

describe("getOverviewQueryDate", () => {
    it("returns a stable string for the same input date", () => {
        const now = new Date("2024-01-01T12:00:00Z");
        const result1 = getOverviewQueryDate(now);
        const result2 = getOverviewQueryDate(now);
        expect(result1).toBe(result2);
    });

    it("ignores time differences within the same day", () => {
        const morning = new Date("2024-01-01T08:00:00Z");
        const evening = new Date("2024-01-01T20:00:00Z");
        const resMorning = getOverviewQueryDate(morning);
        const resEvening = getOverviewQueryDate(evening);
        expect(resMorning).toBe(resEvening);
    });

    it("returns a date 14 days prior to the start of day", () => {
        const now = new Date("2024-01-15T12:00:00Z");
        const query = getOverviewQueryDate(now);

        // Dynamic check using the same logic to respect local timezone of test runner
        const expected = subDays(startOfDay(now), 14).toISOString();

        expect(query).toBe(expected);
    });
});
