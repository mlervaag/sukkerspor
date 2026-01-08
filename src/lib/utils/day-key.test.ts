import { describe, it, expect } from "vitest";
import { computeDayKey } from "./day-key";

describe("computeDayKey", () => {
    it("should return the same day key regardless of DST (Spring forward 2026)", () => {
        // Norway switches to CEST on Sunday, March 29, 2026, at 02:00:00

        // 01:30:00 CET (UTC+1)
        const beforeDST = new Date("2026-03-29T00:30:00Z");
        // 03:30:00 CEST (UTC+2)
        const afterDST = new Date("2026-03-29T01:30:00Z");

        expect(computeDayKey(beforeDST)).toBe("2026-03-29");
        expect(computeDayKey(afterDST)).toBe("2026-03-29");
    });

    it("should return the same day key regardless of DST (Fall back 2026)", () => {
        // Norway switches to CET on Sunday, October 25, 2026, at 03:00:00

        // 02:30:00 CEST (UTC+2)
        const beforeDST = new Date("2026-10-25T00:30:00Z");
        // 02:30:00 CET (UTC+1)
        const afterDST = new Date("2026-10-25T01:30:00Z");

        expect(computeDayKey(beforeDST)).toBe("2026-10-25");
        expect(computeDayKey(afterDST)).toBe("2026-10-25");
    });

    it("should handle midnight correctly in Europe/Oslo", () => {
        // 00:00:01 in Oslo
        const justAfterMidnight = new Date("2026-01-15T23:00:01Z");
        // 23:59:59 in Oslo (previous day)
        const justBeforeMidnight = new Date("2026-01-14T22:59:59Z");

        expect(computeDayKey(justAfterMidnight)).toBe("2026-01-16");
        expect(computeDayKey(justBeforeMidnight)).toBe("2026-01-14");

        // Wait, let's re-verify the midnight logic.
        // 2026-01-16T00:00:01 Oslo time is 2026-01-15T23:00:01 UTC.
        // So computeDayKey(new Date("2026-01-15T23:00:01Z")) should be "2026-01-16".
    });
});
