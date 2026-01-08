import { startOfDay, subDays } from "date-fns";

/**
 * Generates a stable ISO string for the Overview query (14 days ago from start of today).
 * This anchors the query to the start of the current day, preventing 
 * milliseconds-level drift that causes fetch loops.
 */
export function getOverviewQueryDate(now: Date = new Date()): string {
    const today = startOfDay(now);
    return subDays(today, 14).toISOString();
}
