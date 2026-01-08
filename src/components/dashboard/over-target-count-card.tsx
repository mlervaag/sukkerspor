"use client";

import { AlertTriangle } from "lucide-react";

interface OverTargetCountCardProps {
    count7d: number;
    count14d: number;
}

export function OverTargetCountCard({ count7d, count14d }: OverTargetCountCardProps) {
    const showBadge = count14d > 3;

    return (
        <div className="card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Målinger over referanse
            </h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{count7d}</div>
                    <div className="text-xs text-muted-foreground">Siste 7 dager</div>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl font-bold text-primary">{count14d}</span>
                        {showBadge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                                <AlertTriangle size={12} />
                                Mer enn 3
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">Siste 14 dager</div>
                </div>
            </div>

            {showBadge && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Helsenorge anbefaler å kontakte jordmor eller lege dersom du har mer enn 3 målinger over referanseverdiene i løpet av 14 dager.
                </p>
            )}
        </div>
    );
}
