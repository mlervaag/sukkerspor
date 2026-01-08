import { describe, it, expect } from "vitest";
import { computeDashboardStats, computeMealBreakdown, computeDailyTrends, THRESHOLDS } from "./analytics";
import { GlucoseReading } from "./types";

describe("analytics", () => {
    const mockReadings: GlucoseReading[] = [
        {
            id: "1",
            valueMmolL: "5.5",
            isFasting: true,
            isPostMeal: false,
            mealType: null,
            partOfDay: null,
            foodText: null,
            feelingNotes: null,
            measuredAt: new Date("2024-01-10T08:00:00Z"),
            dayKey: "2024-01-10",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "2",
            valueMmolL: "7.0",
            isFasting: false,
            isPostMeal: true,
            mealType: "frokost",
            partOfDay: null,
            foodText: null,
            feelingNotes: null,
            measuredAt: new Date("2024-01-10T10:00:00Z"),
            dayKey: "2024-01-10",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "3",
            valueMmolL: "5.0",
            isFasting: true,
            isPostMeal: false,
            mealType: null,
            partOfDay: null,
            foodText: null,
            feelingNotes: null,
            measuredAt: new Date("2024-01-11T08:00:00Z"),
            dayKey: "2024-01-11",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "4",
            valueMmolL: "6.5",
            isFasting: false,
            isPostMeal: true,
            mealType: "lunsj",
            partOfDay: null,
            foodText: null,
            feelingNotes: null,
            measuredAt: new Date("2024-01-11T12:00:00Z"),
            dayKey: "2024-01-11",
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    describe("computeDashboardStats", () => {
        it("correctly calculates averages and compliance", () => {
            const stats = computeDashboardStats(mockReadings, mockReadings);
            expect(stats.averageFasting).toBeCloseTo(5.25);
            expect(stats.averagePostMeal).toBeCloseTo(6.75);
            expect(stats.overTargetCount14d).toBe(2); // 5.5 > 5.3 and 7.0 > 6.7
            expect(stats.coverageFasting).toBe(2);
            expect(stats.coveragePostMeal).toBe(2);
        });

        it("handles empty readings", () => {
            const stats = computeDashboardStats([], []);
            expect(stats.averageFasting).toBeNull();
            expect(stats.overTargetCount14d).toBe(0);
            expect(stats.coverageFasting).toBe(0);
        });

        it("computes within target stats correctly", () => {
            const stats = computeDashboardStats(mockReadings, mockReadings);
            // Fasting: readings are 5.5 and 5.0. 
            // 5.5 > 5.3 (over), 5.0 <= 5.3 (within)
            // Within: 1, Total: 2
            expect(stats.withinTarget.fasting7d).toEqual({ within: 1, total: 2 });
            expect(stats.withinTarget.fasting14d).toEqual({ within: 1, total: 2 });

            // PostMeal: readings are 7.0 (over) and 6.5 (within)
            expect(stats.withinTarget.postMeal7d).toEqual({ within: 1, total: 2 });
        });

        it("computes high/low stats correctly", () => {
            const stats = computeDashboardStats(mockReadings, mockReadings);
            // Fasting: 5.5, 5.0 -> High: 5.5, Low: 5.0
            expect(stats.highLow.fasting7d).toEqual({ high: 5.5, low: 5.0 });

            // PostMeal: 7.0, 6.5 -> High: 7.0, Low: 6.5
            expect(stats.highLow.postMeal7d).toEqual({ high: 7.0, low: 6.5 });
        });

        it("computes data quality gaps", () => {
            const badReadings: GlucoseReading[] = [
                ...mockReadings,
                { ...mockReadings[0], id: "x", isFasting: false, isPostMeal: false, measuredAt: new Date() }
            ];
            const stats = computeDashboardStats(badReadings, badReadings);
            expect(stats.qualityMissingTypeCount).toBe(1);
        });
    });

    describe("computeMealBreakdown", () => {
        it("gates by minimum count of 3", () => {
            const stats = computeMealBreakdown(mockReadings);
            expect(stats.length).toBe(0); // Only 1 frokost and 1 lunsj
        });

        it("correctly averages specific meal types", () => {
            const manyReadings: GlucoseReading[] = [
                ...mockReadings,
                { ...mockReadings[1], id: "5", measuredAt: new Date("2024-01-11T10:00:00Z") },
                { ...mockReadings[1], id: "6", measuredAt: new Date("2024-01-12T10:00:00Z") }
            ];
            const stats = computeMealBreakdown(manyReadings);
            expect(stats.length).toBe(1);
            expect(stats[0].mealType).toBe("frokost");
            expect(stats[0].count).toBe(3);
        });
    });

    describe("computeDailyTrends", () => {
        it("handles short data", () => {
            const trends = computeDailyTrends(mockReadings);
            expect(trends.data.length).toBe(0);
            expect(trends.label).toBeNull();
        });

        it("applies 3-day smoothing", () => {
            const readings: GlucoseReading[] = [];
            for (let i = 0; i < 5; i++) {
                readings.push({
                    ...mockReadings[0],
                    id: String(i),
                    dayKey: `2024-01-1${i}`,
                    valueMmolL: String(5 + i)
                });
            }
            const trends = computeDailyTrends(readings);
            expect(trends.data.length).toBe(5);
            expect(trends.label).toBe("Økende");
        });
    });
});
