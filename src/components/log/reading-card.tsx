"use client";

import { GlucoseReading } from "@/lib/domain/types";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface ReadingCardProps {
    reading: GlucoseReading;
    onClick: () => void;
}

export function ReadingCard({ reading, onClick }: ReadingCardProps) {
    const time = format(new Date(reading.measuredAt), "HH:mm");

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-border active:scale-[0.98] transition-all"
        >
            <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-muted-foreground">{time}</span>
                <div className="flex items-center gap-2">
                    {reading.isFasting && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase tracking-tight">Fastende</span>}
                    {reading.isPostMeal && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold uppercase tracking-tight">{reading.mealType || "Etter måltid"}</span>}
                </div>
            </div>

            <div className="text-2xl font-bold text-primary">
                {reading.valueMmolL} <span className="text-sm font-normal text-muted-foreground">mmol/L</span>
            </div>
        </button>
    );
}
