"use client";

import { AlertTriangle } from "lucide-react";

interface OverTargetCountCardProps {
    count7d: number;
    count14d: number;
    breakdown7d?: { fasting: number; postMeal: number };
    breakdown14d?: { fasting: number; postMeal: number };
}

export function OverTargetCountCard({ count7d, count14d, breakdown7d, breakdown14d }: OverTargetCountCardProps) {
    const showBadge = count14d > 3;

    return (
        <div className="card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Målinger over referanse
            </h3>

            <div className="grid grid-cols-2 gap-4 divide-x divide-border/50">
                <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-primary leading-none">{count7d}</div>
                    <div className="text-xs text-muted-foreground font-medium">Siste 7 dager</div>
                    {breakdown7d && (
                        <div className="text-[10px] text-muted-foreground/70 pt-1">
                            Fastende: {breakdown7d.fasting}, Etter: {breakdown7d.postMeal}
                        </div>
                    )}
                </div>
                <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 leading-none">
                        <span className="text-2xl font-bold text-primary">{count14d}</span>
                        {showBadge && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                                <AlertTriangle size={10} />
                                &gt;3
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Siste 14 dager</div>
                    {breakdown14d && (
                        <div className="text-[10px] text-muted-foreground/70 pt-1">
                            Fastende: {breakdown14d.fasting}, Etter: {breakdown14d.postMeal}
                        </div>
                    )}
                </div>
            </div>

            {showBadge && (
                <p className="text-xs text-muted-foreground pt-3 border-t border-border mt-1">
                    Helsenorge anbefaler å kontakte jordmor/lege ved mer enn 3 høye målinger på 14 dager.
                </p>
            )}
        </div>
    );
}
