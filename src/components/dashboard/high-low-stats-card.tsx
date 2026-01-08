"use client";

interface Range {
    high: number;
    low: number;
}

interface HighLowStatsCardProps {
    fasting7d: Range | null;
    postMeal7d: Range | null;
}

export function HighLowStatsCard({ fasting7d, postMeal7d }: HighLowStatsCardProps) {
    if (!fasting7d && !postMeal7d) return null;

    const StatCol = ({ label, range }: { label: string, range: Range | null }) => (
        <div className="space-y-1 text-center">
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
            {range ? (
                <div className="flex justify-center gap-2 text-sm font-semibold">
                    <span className="text-foreground">{range.low.toFixed(1)}</span>
                    <span className="text-muted-foreground/50">–</span>
                    <span className="text-foreground">{range.high.toFixed(1)}</span>
                </div>
            ) : (
                <div className="text-sm font-medium text-muted-foreground">—</div>
            )}
        </div>
    );

    return (
        <div className="card py-3 px-4 flex items-center justify-between gap-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 leading-tight">
                Høy/lav<br />(7d)
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 divide-x divide-border/50">
                <StatCol label="Fastende" range={fasting7d} />
                <StatCol label="Etter måltid" range={postMeal7d} />
            </div>
        </div>
    );
}
