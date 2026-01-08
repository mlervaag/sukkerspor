import { GlucoseReading } from "./types";
import { isSameDay, startOfDay } from "date-fns";

export interface DashboardStats {
    lastLoggedAt: Date | null;
    hasLoggedToday: boolean;
    weekCompleteness: number; // 0-1 percentage
    averageFasting: number | null;
    averagePostMeal: number | null;
    compliancePercentage: number;
}

export const THRESHOLDS = {
    FASTING: 5.3,
    POST_MEAL: 6.7,
};

export function computeDashboardStats(readings: GlucoseReading[]): DashboardStats {
    const now = new Date();

    // Last logged
    const lastLogged = readings.length > 0
        ? new Date(Math.max(...readings.map(r => new Date(r.measuredAt).getTime())))
        : null;

    // Today's status
    const hasLoggedToday = readings.some(r => isSameDay(new Date(r.measuredAt), now));

    // Week completeness (expecting at least 4 readings per day for full completeness as a heuristic, or just check days with entries)
    // Let's use "number of days in week with at least one reading" out of 7.
    const uniqueDaysWithReadings = new Set(readings.map(r => r.dayKey)).size;
    const weekCompleteness = uniqueDaysWithReadings / 7;

    // Averages
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

    return {
        lastLoggedAt: lastLogged,
        hasLoggedToday,
        weekCompleteness,
        averageFasting: avgFasting,
        averagePostMeal: avgPostMeal,
        compliancePercentage,
    };
}
