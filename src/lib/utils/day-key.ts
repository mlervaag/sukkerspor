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

export function getISOWeek(date: Date): { year: number; week: number } {
    return {
        year: getISOWeekYear(date),
        week: getWeek(date),
    };
}
