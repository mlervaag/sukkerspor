"use client";

import { InsulinDose } from "@/lib/domain/types";
import { format } from "date-fns";
import { Syringe } from "lucide-react";

interface InsulinDoseCardProps {
    dose: InsulinDose;
    onClick: () => void;
}

export function InsulinDoseCard({ dose, onClick }: InsulinDoseCardProps) {
    const time = format(new Date(dose.administeredAt), "HH:mm");
    const isLongActing = dose.insulinType === "long_acting";

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border border-l-4 border-l-violet-400 dark:border-l-violet-500 active:scale-[0.98] transition-all"
        >
            <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-muted-foreground">{time}</span>
                <div className="flex items-center gap-2">
                    <Syringe size={14} className="text-violet-500" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-bold uppercase tracking-tight">
                        {isLongActing ? "Langtidsvirkende" : "Hurtigvirkende"}
                    </span>
                    {dose.insulinName && (
                        <span className="text-xs text-muted-foreground">
                            {dose.insulinName}
                        </span>
                    )}
                    {!isLongActing && dose.mealContext && (
                        <span className="text-xs text-muted-foreground">
                            {dose.mealContext}
                        </span>
                    )}
                </div>
            </div>

            <div className="text-2xl font-bold font-mono text-violet-600 dark:text-violet-400">
                {dose.doseUnits} <span className="text-sm font-normal text-muted-foreground">E</span>
            </div>
        </button>
    );
}
