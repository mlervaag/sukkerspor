"use client";

import { MealStat } from "@/lib/domain/analytics";

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
    snack: "Mellommåltid",
};

export function MealBreakdownCard({ meals }: MealBreakdownCardProps) {
    if (meals.length === 0) {
        return (
            <div className="card space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fordeling per måltid (siste 14 dager)
                </h3>
                <p className="text-sm text-muted-foreground italic py-2">
                    Ikke nok data for å vise fordeling. Logg minst 3 målinger per måltid.
                </p>
            </div>
        );
    }

    return (
        <div className="card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fordeling per måltid (siste 14 dager)
            </h3>
            <div className="space-y-4">
                {meals.map((meal) => {
                    const label = mealLabels[meal.mealType.toLowerCase()] || meal.mealType;
                    const overTargetPercent = (meal.overTargetCount / meal.count) * 100;

                    return (
                        <div key={meal.mealType} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{label}</span>
                                <span className="text-muted-foreground">
                                    {meal.average?.toFixed(1)} mmol/L · {meal.overTargetCount} over referanse
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
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
