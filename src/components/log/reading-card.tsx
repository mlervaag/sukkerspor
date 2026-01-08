"use client";

import { GlucoseReading } from "@/lib/domain/types";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { THRESHOLDS } from "@/lib/domain/analytics";

interface ReadingCardProps {
    reading: GlucoseReading;
    onClick: () => void;
}

export function ReadingCard({ reading, onClick }: ReadingCardProps) {
    const time = format(new Date(reading.measuredAt), "HH:mm");

    const val = parseFloat(reading.valueMmolL);
    const isOverTarget = (reading.isFasting && val > THRESHOLDS.FASTING) ||
        (reading.isPostMeal && val > THRESHOLDS.POST_MEAL);

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border active:scale-[0.98] transition-all ${isOverTarget ? "border-l-amber-500 border-l-4" : ""
                }`}
        >
            <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-muted-foreground">{time}</span>
                <div className="flex items-center gap-2">
                    {reading.isFasting && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-tight">
                            Fastende
                        </span>
                    )}
                    {reading.isPostMeal && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-bold uppercase tracking-tight">
                            {reading.mealType || "Etter måltid"}
                        </span>
                    )}
                    {reading.isPostMeal && reading.foodText && (
                        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">
                            {reading.foodText}
                        </span>
                    )}
                </div>
            </div>

            <div className="text-2xl font-bold font-mono text-primary">
                {reading.valueMmolL} <span className="text-sm font-normal text-muted-foreground">mmol/L</span>
            </div>
        </button>
    );
}
