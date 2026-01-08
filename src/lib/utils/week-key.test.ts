import { describe, it, expect } from "vitest";
import { computeDayKey } from "./day-key";
import { addDays } from "date-fns";

/**
 * Tests for the weekStartDayKey API parameter behavior.
 * These reproduce the bug where date=2026-01-04T23:00:00.000Z
 * was incorrectly resolving to a different week than expected.
 */
describe("weekStartDayKey derivation", () => {
    // Helper: compute the Monday of the week for a given dayKey
    function computeWeekStartDayKey(dayKey: string): string {
        const localDate = new Date(dayKey + "T12:00:00Z");
        const dayOfWeek = localDate.getUTCDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = addDays(localDate, mondayOffset);
        return monday.toISOString().split("T")[0];
    }

    it("date=2026-01-04T23:00:00.000Z resolves to weekStartDayKey=2026-01-05 (Oslo = Jan 5)", () => {
        // 2026-01-04T23:00:00.000Z = 2026-01-05T00:00:00 Europe/Oslo (CET, UTC+1)
        const utcDate = new Date("2026-01-04T23:00:00.000Z");
        const localDayKey = computeDayKey(utcDate);

        // In Oslo, this is January 5th
        expect(localDayKey).toBe("2026-01-05");

        // The Monday of the week containing Jan 5, 2026
        // Jan 5, 2026 is a Monday!
        const weekStart = computeWeekStartDayKey(localDayKey);
        expect(weekStart).toBe("2026-01-05");
    });

    it("weekStartDayKey=2026-01-05 range includes 2026-01-08", () => {
        const weekStartDayKey = "2026-01-05";
        const startDate = new Date(weekStartDayKey + "T12:00:00Z");
        const endDate = addDays(startDate, 6);
        const weekEndDayKey = endDate.toISOString().split("T")[0];

        expect(weekStartDayKey).toBe("2026-01-05");
        expect(weekEndDayKey).toBe("2026-01-11");

        // 2026-01-08 should be in range
        const testDayKey = "2026-01-08";
        expect(testDayKey >= weekStartDayKey && testDayKey <= weekEndDayKey).toBe(true);
    });

    it("invalid weekStartDayKey format should be rejected", () => {
        const invalidFormats = [
            "2026-1-05",      // Missing leading zeros
            "2026/01/05",     // Wrong separator
            "05-01-2026",     // Wrong order
            "2026-01-05T00",  // Extra time component
            "",               // Empty
        ];

        const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

        for (const invalid of invalidFormats) {
            expect(DAY_KEY_REGEX.test(invalid)).toBe(false);
        }

        // Valid format
        expect(DAY_KEY_REGEX.test("2026-01-05")).toBe(true);
    });

    it("date near midnight Oslo resolves to correct week", () => {
        // 2026-01-11T22:59:00Z = 2026-01-11T23:59:00 Oslo (still Sunday)
        const lateUtc = new Date("2026-01-11T22:59:00.000Z");
        const lateLocalDayKey = computeDayKey(lateUtc);
        expect(lateLocalDayKey).toBe("2026-01-11");
        expect(computeWeekStartDayKey(lateLocalDayKey)).toBe("2026-01-05");

        // 2026-01-11T23:01:00Z = 2026-01-12T00:01:00 Oslo (Monday of next week)
        const earlyNextUtc = new Date("2026-01-11T23:01:00.000Z");
        const earlyNextLocalDayKey = computeDayKey(earlyNextUtc);
        expect(earlyNextLocalDayKey).toBe("2026-01-12");
        expect(computeWeekStartDayKey(earlyNextLocalDayKey)).toBe("2026-01-12");
    });
});
