import { GlucoseReading } from "./types";
import { isSameDay, startOfDay } from "date-fns";

export interface DashboardStats {
    lastLoggedAt: Date | null;
    hasLoggedToday: boolean;
    weekCompleteness: number; // 0-1 percentage
    averageFasting: number | null;
    averagePostMeal: number | null;
    compliancePercentage: number;
    // Iteration 1 additions
    overTargetCount7d: number;
    overTargetCount14d: number;

    coverageFasting: number; // days 0-7
    coveragePostMeal: number; // days 0-7
    // Iteration 2 additions
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

export function computeDashboardStats(
    readings: GlucoseReading[],
    readings7d: GlucoseReading[]
): DashboardStats {
    const now = new Date();

    // Last logged
    const lastLogged = readings.length > 0
        ? new Date(Math.max(...readings.map(r => new Date(r.measuredAt).getTime())))
        : null;

    // Today's status
    const hasLoggedToday = readings.some(r => isSameDay(new Date(r.measuredAt), now));

    // Week completeness (expecting at least 4 readings per day for full completeness as a heuristic, or just check days with entries)
    // Let's use "number of days in week with at least one reading" out of 7.
    const uniqueDaysWithReadings = new Set(readings7d.map(r => r.dayKey)).size;
    const weekCompleteness = uniqueDaysWithReadings / 7;

    // Averages (use all readings provided)
    const fastingReadings = readings.filter(r => r.isFasting);
    const postMealReadings = readings.filter(r => r.isPostMeal);

    const avgFasting = fastingReadings.length > 0
        ? fastingReadings.reduce((sum, r) => sum + parseFloat(r.valueMmolL), 0) / fastingReadings.length
        : null;

    const avgPostMeal = postMealReadings.length > 0
        ? postMealReadings.reduce((sum, r) => sum + parseFloat(r.valueMmolL), 0) / postMealReadings.length
        : null;

    // Compliance
    const compliantReadings = readings.filter(r => {
        const val = parseFloat(r.valueMmolL);
        if (r.isFasting) return val <= THRESHOLDS.FASTING;
        if (r.isPostMeal) return val <= THRESHOLDS.POST_MEAL;
        return true; // Other readings don't count towards non-compliance for now
    });

    const compliancePercentage = readings.length > 0
        ? (compliantReadings.length / readings.length) * 100
        : 100;

    // Over-target counts (Iteration 1)
    const isOverTarget = (r: GlucoseReading): boolean => {
        const val = parseFloat(r.valueMmolL);
        if (r.isFasting) return val > THRESHOLDS.FASTING;
        if (r.isPostMeal) return val > THRESHOLDS.POST_MEAL;
        return false;
    };

    const overTargetCount14d = readings.filter(isOverTarget).length;
    const overTargetCount7d = readings7d.filter(isOverTarget).length;

    // Coverage (Iteration 1) - days with at least one fasting/post-meal reading in 7d
    const fastingDays = new Set(
        readings7d.filter(r => r.isFasting).map(r => r.dayKey)
    ).size;
    const postMealDays = new Set(
        readings7d.filter(r => r.isPostMeal).map(r => r.dayKey)
    ).size;

    // Quality stats (Iteration 2)
    const qualityMissingTypeCount = readings.filter(r => !r.isFasting && !r.isPostMeal).length;

    // Within Target (Iteration 2)
    const computeWithin = (rs: GlucoseReading[], type: 'fasting' | 'postMeal') => {
        const filtered = rs.filter(r => type === 'fasting' ? r.isFasting : r.isPostMeal);
        if (filtered.length === 0) return null;
        const limit = type === 'fasting' ? THRESHOLDS.FASTING : THRESHOLDS.POST_MEAL;
        const within = filtered.filter(r => parseFloat(r.valueMmolL) <= limit).length;
        return { within, total: filtered.length };
    };

    const withinTarget = {
        fasting7d: computeWithin(readings7d, 'fasting'),
        postMeal7d: computeWithin(readings7d, 'postMeal'),
        fasting14d: computeWithin(readings, 'fasting'),
        postMeal14d: computeWithin(readings, 'postMeal'),
    };

    // High/Low Stats (Iteration 2)
    const computeHighLow = (rs: GlucoseReading[], type: 'fasting' | 'postMeal') => {
        const filtered = rs.filter(r => type === 'fasting' ? r.isFasting : r.isPostMeal);
        if (filtered.length === 0) return null;
        const values = filtered.map(r => parseFloat(r.valueMmolL));
        return { high: Math.max(...values), low: Math.min(...values) };
    };

    const highLow = {
        fasting7d: computeHighLow(readings7d, 'fasting'),
        postMeal7d: computeHighLow(readings7d, 'postMeal'),
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

    // Group by mealType
    const groups = new Map<string, GlucoseReading[]>();
    postMealReadings.forEach(r => {
        const type = r.mealType || "Annet";
        const group = groups.get(type) || [];
        group.push(r);
        groups.set(type, group);
    });

    const stats: MealStat[] = [];
    groups.forEach((groupReadings, mealType) => {
        if (groupReadings.length < 3) return;

        const count = groupReadings.length;
        const sum = groupReadings.reduce((s, r) => s + parseFloat(r.valueMmolL), 0);
        const average = sum / count;
        const overTargetCount = groupReadings.filter(r => parseFloat(r.valueMmolL) > THRESHOLDS.POST_MEAL).length;

        stats.push({
            mealType,
            count,
            average,
            overTargetCount
        });
    });

    // Sort by meal type importance (rough heuristic)
    const order = ["frokost", "breakfast", "lunsj", "lunch", "middag", "dinner", "kveldsmat", "evening_meal", "snack", "Annet"];
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
    // Group by dayKey
    const daysMap = new Map<string, number[]>();
    readings.forEach(r => {
        const vals = daysMap.get(r.dayKey) || [];
        vals.push(parseFloat(r.valueMmolL));
        daysMap.set(r.dayKey, vals);
    });

    // Get sorted unique day keys, limited to last 7
    const sortedDays = Array.from(daysMap.keys()).sort().slice(-7);

    if (sortedDays.length < 3) {
        return { data: [], label: null };
    }

    // Compute raw daily averages
    const rawAverages: DailyTrend[] = sortedDays.map(day => ({
        date: day,
        avg: daysMap.get(day)!.reduce((s, v) => s + v, 0) / daysMap.get(day)!.length
    }));

    // Apply 3-day rolling average
    const smoothedData: DailyTrend[] = rawAverages.map((day, i) => {
        if (i < 2) return day;
        const slice = rawAverages.slice(i - 2, i + 1);
        const avg = slice.reduce((s, d) => s + d.avg, 0) / slice.length;
        return { ...day, avg };
    });

    // Compute simple slope from first to last (smoothed)
    const first = smoothedData[0].avg;
    const last = smoothedData[smoothedData.length - 1].avg;
    const diff = last - first;

    let label: "Stabil" | "Økende" | "Synkende" | null = "Stabil";
    if (diff > 0.3) label = "Økende";
    else if (diff < -0.3) label = "Synkende";

    return { data: smoothedData, label };
}
