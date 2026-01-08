import { computeDayKey } from "./day-key";
import { subDays } from "date-fns";

/**
 * Generates stable startDayKey and endDayKey for the Overview fetching (14 days).
 * endDayKey = Today (Oslo)
 * startDayKey = Today - 13 days
 */
export function getOverviewQueryRange(now: Date = new Date()): { startDayKey: string; endDayKey: string } {
    const endDayKey = computeDayKey(now);

    // We can't just subtract days from the dayKey string.
    // We should assume 'now' is a Date object, subtract 13 days, then compute that dayKey.
    // Note: subDays respects local time of the Date object passed to it.
    const startDate = subDays(now, 13);
    const startDayKey = computeDayKey(startDate);

    return { startDayKey, endDayKey };
}
