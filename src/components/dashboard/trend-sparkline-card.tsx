"use client";

import { DailyTrend } from "@/lib/domain/analytics";

interface TrendSparklineCardProps {
    data: DailyTrend[];
    label: "Stabil" | "Økende" | "Synkende" | null;
}

export function TrendSparklineCard({ data, label }: TrendSparklineCardProps) {
    if (data.length === 0 || !label) {
        return (
            <div className="card space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Retning (siste 7 dager)
                </h3>
                <p className="text-sm text-muted-foreground italic py-4">
                    Ikke nok data ennå. Logg målinger over minst 3 dager.
                </p>
            </div>
        );
    }

    // SVG parameters
    const height = 40;
    const width = 160;
    const padding = 4;

    const minVal = Math.min(...data.map(d => d.avg)) - 0.5;
    const maxVal = Math.max(...data.map(d => d.avg)) + 0.5;
    const range = maxVal - minVal;

    const points = data.map((day, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((day.avg - minVal) / range) * (height - 2 * padding) - padding;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Retning (siste 7 dager)
            </h3>

            <div className="flex items-end justify-between gap-4">
                <div className="flex-1 h-[40px]">
                    <svg width="100%" height="40" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        <polyline
                            points={points}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                        />
                    </svg>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-primary whitespace-nowrap">
                        {label === "Stabil" && "→ Stabil"}
                        {label === "Økende" && "↗ Økende"}
                        {label === "Synkende" && "↘ Synkende"}
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                Basert på 3-dagers glidende gjennomsnitt.
            </p>
        </div>
    );
}
