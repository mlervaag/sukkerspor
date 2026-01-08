import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { between, asc } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { GlucoseReading } from "../domain/types";

export type ReportRange = "week" | "month" | "all";

export async function getReportData(range: ReportRange, date: Date = new Date()) {
    let start: Date | null = null;
    let end: Date | null = null;

    if (range === "week") {
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
    } else if (range === "month") {
        start = startOfMonth(date);
        end = endOfMonth(date);
    }

    const query = db.select().from(glucoseReadings);

    if (start && end) {
        query.where(between(glucoseReadings.measuredAt, start, end));
    }

    const readings = await query.orderBy(asc(glucoseReadings.measuredAt));

    // Stats calculations
    const stats = calculateStats(readings as any as GlucoseReading[]);

    return {
        readings: readings as any as GlucoseReading[],
        stats,
        range,
        start,
        end,
    };
}

function calculateStats(readings: GlucoseReading[]) {
    const total = readings.length;
    if (total === 0) return null;

    const fasting = readings.filter(r => r.isFasting);
    const postMeal = readings.filter(r => r.isPostMeal);

    const avgFasting = fasting.length > 0
        ? fasting.reduce((acc, r) => acc + parseFloat(r.valueMmolL), 0) / fasting.length
        : null;

    const mealTypeStats = ["Frokost", "Lunsj", "Middag", "Kvelds", "Mellommåltid"].map(m => {
        const typeReadings = postMeal.filter(r => r.mealType === m);
        return {
            type: m,
            avg: typeReadings.length > 0
                ? typeReadings.reduce((acc, r) => acc + parseFloat(r.valueMmolL), 0) / typeReadings.length
                : null,
            count: typeReadings.length
        };
    });

    // Threshold compliance (simple example: 4-7 fasting, <9 post-meal)
    const compliant = readings.filter(r => {
        const val = parseFloat(r.valueMmolL);
        if (r.isFasting) return val >= 4.0 && val <= 7.0;
        if (r.isPostMeal) return val < 9.0;
        return true;
    }).length;

    return {
        total,
        avgFasting,
        mealTypeStats,
        compliancePercent: (compliant / total) * 100,
    };
}
