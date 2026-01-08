import { describe, it, expect } from "vitest";
import { computeDayKey } from "./day-key";

describe("computeDayKey grouping", () => {
    it("groups readings by Europe/Oslo date, not UTC", () => {
        // 2026-01-15 23:30:00 UTC = 2026-01-16 00:30:00 Europe/Oslo (CET, UTC+1)
        const lateNightUTC = new Date("2026-01-15T23:30:00Z");
        expect(computeDayKey(lateNightUTC)).toBe("2026-01-16");

        // 2026-01-15 22:30:00 UTC = 2026-01-15 23:30:00 Europe/Oslo
        const beforeMidnightUTC = new Date("2026-01-15T22:30:00Z");
        expect(computeDayKey(beforeMidnightUTC)).toBe("2026-01-15");
    });

    it("handles DST spring forward correctly", () => {
        // Norway DST: 2026-03-29 02:00 CET becomes 03:00 CEST
        // 2026-03-29 00:30:00 UTC = 2026-03-29 01:30:00 CET
        const beforeDST = new Date("2026-03-29T00:30:00Z");
        expect(computeDayKey(beforeDST)).toBe("2026-03-29");

        // 2026-03-29 01:30:00 UTC = 2026-03-29 03:30:00 CEST
        const afterDST = new Date("2026-03-29T01:30:00Z");
        expect(computeDayKey(afterDST)).toBe("2026-03-29");
    });

    it("handles DST fall back correctly", () => {
        // Norway DST: 2026-10-25 03:00 CEST becomes 02:00 CET
        // 2026-10-25 00:30:00 UTC = 2026-10-25 02:30:00 CEST
        const beforeDST = new Date("2026-10-25T00:30:00Z");
        expect(computeDayKey(beforeDST)).toBe("2026-10-25");

        // 2026-10-25 02:30:00 UTC = 2026-10-25 03:30:00 CET
        const afterDST = new Date("2026-10-25T02:30:00Z");
        expect(computeDayKey(afterDST)).toBe("2026-10-25");
    });

    it("week filtering uses dayKey range correctly", () => {
        // Monday 2026-01-05 to Sunday 2026-01-11
        const monday = new Date("2026-01-05T12:00:00Z");
        const sunday = new Date("2026-01-11T12:00:00Z");

        const mondayKey = computeDayKey(monday);
        const sundayKey = computeDayKey(sunday);

        expect(mondayKey).toBe("2026-01-05");
        expect(sundayKey).toBe("2026-01-11");

        // A reading at 2026-01-05 should be in range
        const inRange = "2026-01-08";
        expect(inRange >= mondayKey && inRange <= sundayKey).toBe(true);

        // A reading at 2026-01-04 should be out of range
        const outOfRange = "2026-01-04";
        expect(outOfRange >= mondayKey && outOfRange <= sundayKey).toBe(false);
    });
});
