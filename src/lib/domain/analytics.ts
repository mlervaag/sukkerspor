import { GlucoseReading, InsulinDose } from "./types";
import { isSameDay, startOfDay, addDays } from "date-fns";
import { computeDayKey } from "../utils/day-key";

export interface DashboardStats {
    lastLoggedAt: Date | null;
    hasLoggedToday: boolean;
    weekCompleteness: number;
    averageFasting: number | null;
    averagePostMeal: number | null;
    compliancePercentage: number;
    overTargetCount7d: number;
    overTargetCount14d: number;

    overTargetBreakdown: {
        fasting7d: number;
        postMeal7d: number;
        fasting14d: number;
        postMeal14d: number;
    };

    coverageFasting: number;
    coveragePostMeal: number;
    qualityMissingTypeCount: number;
    withinTarget: {
        fasting7d: { within: number; total: number } | null;
        postMeal7d: { within: number; total: number } | null;
        fasting14d: { within: number; total: number } | null;
        postMeal14d: { within: number; total: number } | null;
    };
    highLow: {
        fasting7d: { high: number; low: number } | null;
        postMeal7d: { high: number; low: number } | null;
    };
}

export const THRESHOLDS = {
    FASTING: 5.3,
    POST_MEAL: 6.7,
};

/**
 * Minimum readings per meal type before it's shown in the breakdown.
 * Lowered from 3 to 2 so new users see something quickly.
 */
const MEAL_BREAKDOWN_MIN_READINGS = 2;

export function computeDashboardStats(
    readings: GlucoseReading[],
    readings7d: GlucoseReading[]
): DashboardStats {
    const now = new Date();

    const lastLogged = readings.length > 0
        ? new Date(Math.max(...readings.map(r => new Date(r.measuredAt).getTime())))
        : null;

    const hasLoggedToday = readings.some(r => isSameDay(new Date(r.measuredAt), now));

    const uniqueDaysWithReadings = new Set(readings7d.map(r => r.dayKey)).size;
    const weekCompleteness = uniqueDaysWithReadings / 7;

    const fastingReadings = readings.filter(r => r.isFasting);
    const postMealReadings = readings.filter(r => r.isPostMeal);

    const avgFasting = fastingReadings.length > 0
        ? fastingReadings.reduce((sum, r) => sum + parseFloat(r.valueMmolL), 0) / fastingReadings.length
        : null;

    const avgPostMeal = postMealReadings.length > 0
        ? postMealReadings.reduce((sum, r) => sum + parseFloat(r.valueMmolL), 0) / postMealReadings.length
        : null;

    const compliantReadings = readings.filter(r => {
        const val = parseFloat(r.valueMmolL);
        if (r.isFasting) return val <= THRESHOLDS.FASTING;
        if (r.isPostMeal) return val <= THRESHOLDS.POST_MEAL;
        return true;
    });

    const compliancePercentage = readings.length > 0
        ? (compliantReadings.length / readings.length) * 100
        : 100;

    const isOverTarget = (r: GlucoseReading): boolean => {
        const val = parseFloat(r.valueMmolL);
        if (r.isFasting) return val > THRESHOLDS.FASTING;
        if (r.isPostMeal) return val > THRESHOLDS.POST_MEAL;
        return false;
    };

    const overTargetCount14d = readings.filter(isOverTarget).length;
    const overTargetCount7d = readings7d.filter(isOverTarget).length;

    const computeOverCount = (rs: GlucoseReading[], type: "fasting" | "postMeal") => {
        const limit = type === "fasting" ? THRESHOLDS.FASTING : THRESHOLDS.POST_MEAL;
        return rs.filter(r => {
            if (type === "fasting" && !r.isFasting) return false;
            if (type === "postMeal" && !r.isPostMeal) return false;
            return parseFloat(r.valueMmolL) > limit;
        }).length;
    };

    const overTargetBreakdown = {
        fasting7d: computeOverCount(readings7d, "fasting"),
        postMeal7d: computeOverCount(readings7d, "postMeal"),
        fasting14d: computeOverCount(readings, "fasting"),
        postMeal14d: computeOverCount(readings, "postMeal"),
    };

    const fastingDays = new Set(
        readings7d.filter(r => r.isFasting).map(r => r.dayKey)
    ).size;
    const postMealDays = new Set(
        readings7d.filter(r => r.isPostMeal).map(r => r.dayKey)
    ).size;

    const qualityMissingTypeCount = readings.filter(r => !r.isFasting && !r.isPostMeal).length;

    const computeWithin = (rs: GlucoseReading[], type: "fasting" | "postMeal") => {
        const filtered = rs.filter(r => type === "fasting" ? r.isFasting : r.isPostMeal);
        if (filtered.length === 0) return null;
        const limit = type === "fasting" ? THRESHOLDS.FASTING : THRESHOLDS.POST_MEAL;
        const within = filtered.filter(r => parseFloat(r.valueMmolL) <= limit).length;
        return { within, total: filtered.length };
    };

    const withinTarget = {
        fasting7d: computeWithin(readings7d, "fasting"),
        postMeal7d: computeWithin(readings7d, "postMeal"),
        fasting14d: computeWithin(readings, "fasting"),
        postMeal14d: computeWithin(readings, "postMeal"),
    };

    const computeHighLow = (rs: GlucoseReading[], type: "fasting" | "postMeal") => {
        const filtered = rs.filter(r => type === "fasting" ? r.isFasting : r.isPostMeal);
        if (filtered.length === 0) return null;
        const values = filtered.map(r => parseFloat(r.valueMmolL));
        return { high: Math.max(...values), low: Math.min(...values) };
    };

    const highLow = {
        fasting7d: computeHighLow(readings7d, "fasting"),
        postMeal7d: computeHighLow(readings7d, "postMeal"),
    };

    return {
        lastLoggedAt: lastLogged,
        hasLoggedToday,
        weekCompleteness,
        averageFasting: avgFasting,
        averagePostMeal: avgPostMeal,
        compliancePercentage,
        overTargetCount7d,
        overTargetCount14d,
        overTargetBreakdown,
        coverageFasting: fastingDays,
        coveragePostMeal: postMealDays,
        qualityMissingTypeCount,
        withinTarget,
        highLow,
    };
}

export interface MealStat {
    mealType: string;
    count: number;
    average: number | null;
    overTargetCount: number;
}

export function computeMealBreakdown(readings: GlucoseReading[]): MealStat[] {
    const postMealReadings = readings.filter(r => r.isPostMeal);

    const groups = new Map<string, GlucoseReading[]>();
    postMealReadings.forEach(r => {
        const type = r.mealType || "Annet";
        const group = groups.get(type) || [];
        group.push(r);
        groups.set(type, group);
    });

    const stats: MealStat[] = [];
    groups.forEach((groupReadings, mealType) => {
        if (groupReadings.length < MEAL_BREAKDOWN_MIN_READINGS) return;

        const count = groupReadings.length;
        const sum = groupReadings.reduce((s, r) => s + parseFloat(r.valueMmolL), 0);
        const average = sum / count;
        const overTargetCount = groupReadings.filter(r => parseFloat(r.valueMmolL) > THRESHOLDS.POST_MEAL).length;

        stats.push({ mealType, count, average, overTargetCount });
    });

    const order = ["frokost", "breakfast", "lunsj", "lunch", "middag", "dinner", "kveldsmat", "evening_meal", "mellommåltid", "snack", "annet"];
    return stats.sort((a, b) => {
        const indexA = order.indexOf(a.mealType.toLowerCase());
        const indexB = order.indexOf(b.mealType.toLowerCase());
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
}

export interface DailyTrend {
    date: string;
    avg: number;
}

export function computeDailyTrends(readings: GlucoseReading[]): {
    data: DailyTrend[];
    label: "Stabil" | "Økende" | "Synkende" | null;
} {
    const daysMap = new Map<string, number[]>();
    readings.forEach(r => {
        const vals = daysMap.get(r.dayKey) || [];
        vals.push(parseFloat(r.valueMmolL));
        daysMap.set(r.dayKey, vals);
    });

    const sortedDays = Array.from(daysMap.keys()).sort().slice(-7);

    if (sortedDays.length < 3) {
        return { data: [], label: null };
    }

    const rawAverages: DailyTrend[] = sortedDays.map(day => ({
        date: day,
        avg: daysMap.get(day)!.reduce((s, v) => s + v, 0) / daysMap.get(day)!.length,
    }));

    const smoothedData: DailyTrend[] = rawAverages.map((day, i) => {
        if (i < 2) return day;
        const slice = rawAverages.slice(i - 2, i + 1);
        const avg = slice.reduce((s, d) => s + d.avg, 0) / slice.length;
        return { ...day, avg };
    });

    const first = smoothedData[0].avg;
    const last = smoothedData[smoothedData.length - 1].avg;
    const diff = last - first;

    let label: "Stabil" | "Økende" | "Synkende" = "Stabil";
    if (diff > 0.3) label = "Økende";
    else if (diff < -0.3) label = "Synkende";

    return { data: smoothedData, label };
}

export interface InsulinFastingPair {
    date: string;
    eveningDose: number;
    nextFasting: number | null;
}

export type CorrelationTrend = "increasing_dose_needed" | "stable" | "decreasing_dose_possible" | "insufficient_data";

export interface CorrelationResult {
    pairs: InsulinFastingPair[];
    completePairs: InsulinFastingPair[];
    trend: CorrelationTrend;
    avgFastingByDoseRange: { doseRange: string; avgFasting: number; count: number }[];
    suggestion: string | null;
}

export function computeInsulinFastingCorrelation(
    doses: InsulinDose[],
    readings: GlucoseReading[]
): CorrelationResult {
    const eveningDoses = doses.filter(d => {
        if (d.insulinType !== "long_acting") return false;
        const hour = new Date(d.administeredAt).getHours();
        return hour >= 20;
    });

    const fastingByDay = new Map<string, number>();
    for (const r of readings) {
        if (!r.isFasting) continue;
        if (!fastingByDay.has(r.dayKey)) {
            fastingByDay.set(r.dayKey, parseFloat(r.valueMmolL));
        }
    }

    const pairs: InsulinFastingPair[] = eveningDoses.map(d => {
        // Use Oslo-local dayKey arithmetic to avoid DST / UTC boundary bugs.
        const doseDate = new Date(d.administeredAt);
        const nextDayKey = computeDayKey(addDays(startOfDay(doseDate), 1));
        return {
            date: d.dayKey,
            eveningDose: parseFloat(d.doseUnits),
            nextFasting: fastingByDay.get(nextDayKey) ?? null,
        };
    });

    pairs.sort((a, b) => a.date.localeCompare(b.date));

    const completePairs = pairs.filter(p => p.nextFasting !== null);

    if (completePairs.length < 3) {
        return {
            pairs,
            completePairs,
            trend: "insufficient_data",
            avgFastingByDoseRange: [],
            suggestion: null,
        };
    }

    const doseGroups = new Map<string, number[]>();
    for (const p of completePairs) {
        const bucket = Math.floor(p.eveningDose / 2) * 2;
        const label = `${bucket}-${bucket + 2}`;
        const group = doseGroups.get(label) || [];
        group.push(p.nextFasting!);
        doseGroups.set(label, group);
    }

    const avgFastingByDoseRange = Array.from(doseGroups.entries())
        .map(([doseRange, values]) => ({
            doseRange,
            avgFasting: values.reduce((s, v) => s + v, 0) / values.length,
            count: values.length,
        }))
        .sort((a, b) => a.doseRange.localeCompare(b.doseRange));

    const recent = completePairs.slice(-5);
    const recentFastingValues = recent.map(p => p.nextFasting!);
    const allAboveTarget = recentFastingValues.every(v => v > THRESHOLDS.FASTING);
    const allBelowLow = recentFastingValues.every(v => v < 4.5);

    let trend: CorrelationTrend = "stable";
    let suggestion: string | null = null;

    if (allAboveTarget) {
        trend = "increasing_dose_needed";
        suggestion = `De siste ${recent.length} fastende verdiene (etter kveldsinsulin) har vært over ${THRESHOLDS.FASTING}. Diskuter eventuell dosejustering med lege eller jordmor.`;
    } else if (allBelowLow) {
        trend = "decreasing_dose_possible";
        suggestion = `De siste ${recent.length} fastende verdiene har vært under 4.5. Kontakt behandler for vurdering av dosen.`;
    }

    return {
        pairs,
        completePairs,
        trend,
        avgFastingByDoseRange,
        suggestion,
    };
}
