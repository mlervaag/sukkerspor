"use client";

interface Stat {
    within: number;
    total: number;
}

interface WithinTargetCardProps {
    fasting7d: Stat | null;
    postMeal7d: Stat | null;
    fasting14d: Stat | null;
    postMeal14d: Stat | null;
}

export function WithinTargetCard({ fasting7d, postMeal7d, fasting14d, postMeal14d }: WithinTargetCardProps) {
    if (!fasting7d && !postMeal7d && !fasting14d && !postMeal14d) {
        return (
            <div className="card h-full flex flex-col items-center justify-center p-6 text-muted-foreground gap-2 min-h-[140px]">
                <p className="text-sm font-medium">For lite data</p>
                <p className="text-xs">Logg målinger for å se statistikk</p>
            </div>
        );
    }

    const StatRow = ({ label, stat7, stat14 }: { label: string, stat7: Stat | null, stat14: Stat | null }) => {
        // Prefer 14d as primary context for "Overview" but showing both side by side or one as primary?
        // User requested: "Two windows: last 7 days and last 14 days."
        // Let's optimize for clarity. Maybe 7d is more actionable "now", 14d is "trend".
        // Let's show columns: "Siste 7" | "Siste 14".

        return (
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-medium">{label}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatCell stat={stat7} label="7 dager" />
                    <StatCell stat={stat14} label="14 dager" />
                </div>
            </div>
        );
    }

    const StatCell = ({ stat, label }: { stat: Stat | null, label: string }) => {
        if (!stat || stat.total === 0) {
            return (
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-muted-foreground">—</div>
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                </div>
            )
        }

        const pct = Math.round((stat.within / stat.total) * 100);
        // Color code: < 50% red, 50-80 yellow, > 80 green? Or just neutral?
        // User requested "Non-noisy". Let's use neutral or subtle colors.
        // But "Within Target" is inherently good/bad.
        // Let's keep it strictly numerical/neutral for now as asked ("No medical advice", "neutral indicators").
        // We can use primary color for percentage bar.

        return (
            <div className="bg-muted/20 rounded-lg p-2 flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground">{pct}%</span>
                    <span className="text-[10px] text-muted-foreground">({stat.within}/{stat.total})</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-muted h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
            </div>
        );
    }

    return (
        <div className="card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Innenfor målverdi
            </h3>

            <div className="space-y-4 separate-y">
                <StatRow label="Fastende (< 5,3)" stat7={fasting7d} stat14={fasting14d} />
                <StatRow label="Etter måltid (< 6,7)" stat7={postMeal7d} stat14={postMeal14d} />
            </div>
        </div>
    );
}
