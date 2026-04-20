import { getISOWeek as getWeek, getISOWeekYear } from "date-fns";

export function computeDayKey(date: Date): string {
    // Use Intl.DateTimeFormat to get the date in Europe/Oslo timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    // en-CA returns YYYY-MM-DD
    return formatter.format(date);
}

// Returns the hour (0-23) in Europe/Oslo. Needed because Vercel runs in UTC
// and Date#getHours() would otherwise shift evening doses across DST.
export function getOsloHour(date: Date): number {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Oslo",
        hour: "2-digit",
        hour12: false,
    });
    return parseInt(formatter.format(date), 10);
}

export function getISOWeek(date: Date): { year: number; week: number } {
    return {
        year: getISOWeekYear(date),
        week: getWeek(date),
    };
}
