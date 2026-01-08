import { format } from "date-fns";

/**
 * Combines a YYYY-MM-DD date and HH:mm time into a Date object.
 * Returns null if the combination results in an invalid/ambiguous time (e.g. DST gap).
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
    // ISO format YYYY-MM-DDTHH:mm is interpreted as local time by standard Date constructor
    const isoStr = `${dateStr}T${timeStr}`;
    const date = new Date(isoStr);

    if (isNaN(date.getTime())) return null;

    // Check if the date constructed matches the requested time.
    // This catches DST gaps (e.g., 02:30 becoming 03:30 or 01:30)
    // and other invalid inputs.
    if (format(date, "yyyy-MM-dd'T'HH:mm") !== isoStr) {
        return null;
    }

    return date;
}
