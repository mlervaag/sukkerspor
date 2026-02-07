import { db } from "@/lib/db";
import { glucoseReadings, insulinDoses } from "@/lib/db/schema";
import { between, asc } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { GlucoseReading, InsulinDose } from "../domain/types";
import { THRESHOLDS } from "../domain/analytics";

export type ReportRange = "week" | "month" | "all";

export interface ReportStats {
    total: number;
    avgFasting: number | null;
    avgPostMeal: number | null;
    compliancePercent: number;
    mealTypeStats: { type: string; avg: number | null; count: number }[];
    extended: {
        fasting7d: { total: number; overTarget: number; within: number; high: number | null; low: number | null };
        postMeal7d: { total: number; overTarget: number; within: number; high: number | null; low: number | null };
        fasting14d: { total: number; overTarget: number; within: number; high: number | null; low: number | null };
        postMeal14d: { total: number; overTarget: number; within: number; high: number | null; low: number | null };
    };
}

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

    let readings;
    let doses: any[] = [];
    if (start && end) {
        readings = await db
            .select()
            .from(glucoseReadings)
            .where(between(glucoseReadings.measuredAt, start, end))
            .orderBy(asc(glucoseReadings.measuredAt));
        try {
            doses = await db
                .select()
                .from(insulinDoses)
                .where(between(insulinDoses.administeredAt, start, end))
                .orderBy(asc(insulinDoses.administeredAt));
        } catch {
            // insulin_doses table may not exist yet
        }
    } else {
        readings = await db
            .select()
            .from(glucoseReadings)
            .orderBy(asc(glucoseReadings.measuredAt));
        try {
            doses = await db
                .select()
                .from(insulinDoses)
                .orderBy(asc(insulinDoses.administeredAt));
        } catch {
            // insulin_doses table may not exist yet
        }
    }

    const typedReadings = readings as any as GlucoseReading[];
    const stats = calculateStats(typedReadings);

    return {
        readings: typedReadings,
        insulinDoses: doses as any as InsulinDose[],
        stats,
        range,
        start,
        end,
    };
}

function computeWindowStats(readings: GlucoseReading[], type: "fasting" | "postMeal") {
    const threshold = type === "fasting" ? THRESHOLDS.FASTING : THRESHOLDS.POST_MEAL;
    const filtered = readings.filter(r => type === "fasting" ? r.isFasting : r.isPostMeal);
    const values = filtered.map(r => parseFloat(r.valueMmolL));
    const overTarget = values.filter(v => v > threshold).length;

    return {
        total: filtered.length,
        overTarget,
        within: filtered.length - overTarget,
        high: values.length > 0 ? Math.max(...values) : null,
        low: values.length > 0 ? Math.min(...values) : null,
    };
}

function calculateStats(readings: GlucoseReading[]): ReportStats | null {
    const total = readings.length;
    if (total === 0) return null;

    const now = new Date();
    const d7 = subDays(now, 7);
    const d14 = subDays(now, 14);
    const readings7d = readings.filter(r => new Date(r.measuredAt) >= d7);
    const readings14d = readings.filter(r => new Date(r.measuredAt) >= d14);

    const fasting = readings.filter(r => r.isFasting);
    const postMeal = readings.filter(r => r.isPostMeal);

    const avgFasting = fasting.length > 0
        ? fasting.reduce((acc, r) => acc + parseFloat(r.valueMmolL), 0) / fasting.length
        : null;

    const avgPostMeal = postMeal.length > 0
        ? postMeal.reduce((acc, r) => acc + parseFloat(r.valueMmolL), 0) / postMeal.length
        : null;

    const mealTypeStats = ["Frokost", "Lunsj", "Middag", "Kveldsmat", "Mellommåltid"].map(m => {
        const typeReadings = postMeal.filter(r => r.mealType === m);
        return {
            type: m,
            avg: typeReadings.length > 0
                ? typeReadings.reduce((acc, r) => acc + parseFloat(r.valueMmolL), 0) / typeReadings.length
                : null,
            count: typeReadings.length
        };
    });

    // Use correct thresholds from analytics.ts
    const compliant = readings.filter(r => {
        const val = parseFloat(r.valueMmolL);
        if (r.isFasting) return val <= THRESHOLDS.FASTING;
        if (r.isPostMeal) return val <= THRESHOLDS.POST_MEAL;
        return true; // untyped readings don't count as non-compliant
    }).length;

    return {
        total,
        avgFasting,
        avgPostMeal,
        mealTypeStats,
        compliancePercent: (compliant / total) * 100,
        extended: {
            fasting7d: computeWindowStats(readings7d, "fasting"),
            postMeal7d: computeWindowStats(readings7d, "postMeal"),
            fasting14d: computeWindowStats(readings14d, "fasting"),
            postMeal14d: computeWindowStats(readings14d, "postMeal"),
        },
    };
}
