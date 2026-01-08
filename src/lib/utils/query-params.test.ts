import { describe, it, expect } from "vitest";
import { getOverviewQueryRange } from "./query-params";

describe("getOverviewQueryRange", () => {
    it("returns stable startKey and endKey for the same input date", () => {
        const now = new Date("2024-01-15T12:00:00Z");
        const range1 = getOverviewQueryRange(now);
        const range2 = getOverviewQueryRange(now);
        expect(range1.startDayKey).toBe(range2.startDayKey);
        expect(range1.endDayKey).toBe(range2.endDayKey);
    });

    it("ignores time differences within the same day", () => {
        // Assuming Europe/Oslo behavior, 08:00 and 20:00 are same day
        const morning = new Date("2024-01-15T08:00:00Z");
        const evening = new Date("2024-01-15T20:00:00Z");

        const rangeMorning = getOverviewQueryRange(morning);
        const rangeEvening = getOverviewQueryRange(evening);

        expect(rangeMorning).toEqual(rangeEvening);
    });

    it("returns correct 14 day window", () => {
        // Date: Jan 15th, 2024 (Monday).
        // 13 days back is Jan 2nd.
        // Total range [Jan 2, Jan 15] is 14 days inclusive.
        const now = new Date("2024-01-15T12:00:00Z");
        const range = getOverviewQueryRange(now);

        // Note: computeDayKey uses Europe/Oslo.
        // Jan 15 12:00 UTC is Jan 15 in Oslo.
        expect(range.endDayKey).toBe("2024-01-15");
        expect(range.startDayKey).toBe("2024-01-02");
    });
});
