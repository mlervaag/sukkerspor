"use client";

import { MealStat, THRESHOLDS } from "@/lib/domain/analytics";

interface MealBreakdownCardProps {
    meals: MealStat[];
}

const mealLabels: Record<string, string> = {
    frokost: "Frokost",
    breakfast: "Frokost",
    lunsj: "Lunsj",
    lunch: "Lunsj",
    middag: "Middag",
    dinner: "Middag",
    kveldsmat: "Kveldsmat",
    evening_meal: "Kveldsmat",
    "mellommåltid": "Mellommåltid",
    snack: "Mellommåltid",
    annet: "Annet",
};

export function MealBreakdownCard({ meals }: MealBreakdownCardProps) {
    if (meals.length === 0) {
        return (
            <div className="card space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fordeling per måltid
                </h3>
                <p className="text-sm text-muted-foreground italic py-2">
                    Ikke nok data for å vise fordeling. Logg minst 2 målinger per måltidstype for å se mønstre.
                </p>
            </div>
        );
    }

    return (
        <div className="card space-y-4">
            <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fordeling per måltid
                </h3>
                <span className="text-[10px] text-muted-foreground">Mål: &lt; {THRESHOLDS.POST_MEAL}</span>
            </div>
            <div className="space-y-4">
                {meals.map((meal) => {
                    const label = mealLabels[meal.mealType.toLowerCase()] || meal.mealType;
                    const avg = meal.average ?? 0;
                    const overAvg = avg > THRESHOLDS.POST_MEAL;
                    const overTargetPercent = meal.count > 0 ? (meal.overTargetCount / meal.count) * 100 : 0;

                    return (
                        <div key={meal.mealType} className="space-y-1.5">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-sm font-medium">{label}</span>
                                <div className="flex items-baseline gap-2 text-sm">
                                    <span className={`font-semibold tabular-nums ${overAvg ? "text-amber-600 dark:text-amber-500" : "text-foreground"}`}>
                                        {avg.toFixed(1)}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        snitt · {meal.overTargetCount}/{meal.count} over
                                    </span>
                                </div>
                            </div>
                            <div
                                className="w-full bg-muted rounded-full h-1.5 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={overTargetPercent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${label}: ${Math.round(overTargetPercent)}% over referanse`}
                            >
                                <div
                                    className="bg-amber-500 h-full transition-all"
                                    style={{ width: `${overTargetPercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
