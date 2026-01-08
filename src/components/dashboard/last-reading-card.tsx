"use client";

import { GlucoseReading } from "@/lib/domain/types";
import { THRESHOLDS } from "@/lib/domain/analytics";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Clock } from "lucide-react";

interface LastReadingCardProps {
    lastReading: GlucoseReading | null;
}

export function LastReadingCard({ lastReading }: LastReadingCardProps) {
    if (!lastReading) {
        return (
            <div className="card flex flex-col items-center justify-center h-full py-6 text-muted-foreground gap-2">
                <Clock size={24} className="opacity-50" />
                <p className="text-sm font-medium">Ingen målinger i perioden</p>
            </div>
        );
    }

    const val = parseFloat(lastReading.valueMmolL);
    const isOver = lastReading.isFasting
        ? val > THRESHOLDS.FASTING
        : lastReading.isPostMeal
            ? val > THRESHOLDS.POST_MEAL
            : false; // default false for random

    return (
        <div className="card space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Siste måling
            </h3>
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        {val.toFixed(1)}
                        {isOver && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mb-1" />
                        )}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
                        mmol/L
                    </p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-medium text-foreground">
                        {format(new Date(lastReading.measuredAt), "eee d. MMM", { locale: nb })}
                    </span>
                    <span className="text-sm text-foreground">
                        Kl. {format(new Date(lastReading.measuredAt), "HH:mm")}
                    </span>

                    <div className="mt-1 flex flex-col items-end">
                        <span className="text-xs font-semibold text-muted-foreground">
                            {lastReading.isFasting ? "Fastende" : lastReading.isPostMeal ? "Etter måltid" : "Annet"}
                        </span>
                        {!lastReading.isFasting && lastReading.isPostMeal && lastReading.mealType && (
                            <span className="text-xs text-muted-foreground/80">
                                {lastReading.mealType}
                            </span>
                        )}
                        {lastReading.foodText && (
                            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[100px]" title={lastReading.foodText}>
                                {lastReading.foodText}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
