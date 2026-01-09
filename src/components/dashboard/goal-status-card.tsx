"use client";



interface Stat {
    within: number;
    total: number;
    over: number;
}

interface GoalStatusCardProps {
    fasting: Stat | null;
    postMeal: Stat | null;
    windowLabel: string; // e.g., "7 dager" or "14 dager"
}

export function GoalStatusCard({ fasting, postMeal, windowLabel }: GoalStatusCardProps) {
    // If no data at all
    if (!fasting && !postMeal) {
        return (
            <div className="card h-full flex flex-col items-center justify-center p-6 text-muted-foreground gap-2 min-h-[140px]">
                <p className="text-sm font-medium">Ingen målinger ({windowLabel})</p>
            </div>
        );
    }

    const StatRow = ({ label, stat, limit }: { label: string, stat: Stat | null, limit: string }) => {
        if (!stat || stat.total === 0) {
            return (
                <div className="flex items-center justify-between py-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">{label}</span>
                        <span className="text-[10px] text-muted-foreground/70">Ref.: {limit}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">—</span>
                </div>
            );
        }

        const pct = Math.round((stat.within / stat.total) * 100);
        // "Over" badge only if > 0
        const overCount = stat.over;

        return (
            <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ref.: {limit}</span>
                        {overCount > 0 && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                                {overCount} over
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold tab-nums ${pct >= 80 ? "text-green-600 dark:text-green-500" :
                            pct >= 50 ? "text-amber-600 dark:text-amber-500" :
                                "text-red-600 dark:text-red-500"
                            }`}>
                            {pct}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({stat.within}/{stat.total})
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card px-4 py-3 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Målstatus ({windowLabel})
            </h3>

            <div className="space-y-1">
                <StatRow label="Fastende" stat={fasting} limit="< 5.3" />
                <StatRow label="Etter måltid" stat={postMeal} limit="< 6.7" />
            </div>
        </div>
    );
}
