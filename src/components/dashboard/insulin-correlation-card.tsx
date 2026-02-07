"use client";

import { CorrelationResult, THRESHOLDS } from "@/lib/domain/analytics";
import { Syringe, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface InsulinCorrelationCardProps {
    correlation: CorrelationResult;
}

export function InsulinCorrelationCard({ correlation }: InsulinCorrelationCardProps) {
    const { completePairs, trend, avgFastingByDoseRange, suggestion } = correlation;

    if (completePairs.length < 3) return null;

    const trendIcon = trend === "increasing_dose_needed"
        ? <TrendingUp size={16} className="text-amber-500" />
        : trend === "decreasing_dose_possible"
            ? <TrendingDown size={16} className="text-blue-500" />
            : <Minus size={16} className="text-green-500" />;

    const trendLabel = trend === "increasing_dose_needed"
        ? "Fastende over mål"
        : trend === "decreasing_dose_possible"
            ? "Fastende under mål"
            : "Stabil";

    // SVG chart dimensions
    const chartW = 280;
    const chartH = 120;
    const padL = 35;
    const padR = 10;
    const padT = 10;
    const padB = 20;
    const plotW = chartW - padL - padR;
    const plotH = chartH - padT - padB;

    // Data for chart
    const data = completePairs.slice(-14); // last 14 pairs
    const doses = data.map(p => p.eveningDose);
    const fastings = data.map(p => p.nextFasting!);

    const minDose = Math.min(...doses) - 1;
    const maxDose = Math.max(...doses) + 1;
    const minFasting = Math.min(...fastings, THRESHOLDS.FASTING) - 0.5;
    const maxFasting = Math.max(...fastings, THRESHOLDS.FASTING) + 0.5;

    const xScale = (i: number) => padL + (i / (data.length - 1)) * plotW;
    const yFasting = (v: number) => padT + plotH - ((v - minFasting) / (maxFasting - minFasting)) * plotH;

    // Threshold line y position
    const threshY = yFasting(THRESHOLDS.FASTING);

    // Fasting line points
    const fastingPoints = data.map((_, i) => `${xScale(i)},${yFasting(fastings[i])}`).join(" ");

    return (
        <div className="card space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Syringe size={16} className="text-violet-500" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        Kveldsinsulin vs. fastende
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    {trendIcon}
                    <span className="text-muted-foreground">{trendLabel}</span>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                    {/* Threshold line */}
                    <line
                        x1={padL} y1={threshY} x2={chartW - padR} y2={threshY}
                        stroke="currentColor" className="text-amber-300 dark:text-amber-700"
                        strokeWidth="1" strokeDasharray="4 2"
                    />
                    <text x={padL - 2} y={threshY - 3} fontSize="7" fill="currentColor" className="text-amber-500" textAnchor="end">
                        {THRESHOLDS.FASTING}
                    </text>

                    {/* Fasting line */}
                    <polyline
                        points={fastingPoints}
                        fill="none"
                        stroke="currentColor"
                        className="text-primary"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points with dose labels */}
                    {data.map((p, i) => {
                        const cx = xScale(i);
                        const cy = yFasting(fastings[i]);
                        const isOver = fastings[i] > THRESHOLDS.FASTING;
                        return (
                            <g key={i}>
                                <circle
                                    cx={cx} cy={cy} r="3.5"
                                    fill={isOver ? "rgb(245 158 11)" : "rgb(34 197 94)"}
                                />
                                {/* Dose label below */}
                                <text x={cx} y={chartH - 3} fontSize="6" fill="currentColor" className="text-violet-500" textAnchor="middle">
                                    {p.eveningDose}E
                                </text>
                            </g>
                        );
                    })}

                    {/* Y-axis labels */}
                    <text x={padL - 2} y={padT + 4} fontSize="7" fill="currentColor" className="text-muted-foreground" textAnchor="end">
                        {maxFasting.toFixed(1)}
                    </text>
                    <text x={padL - 2} y={padT + plotH + 2} fontSize="7" fill="currentColor" className="text-muted-foreground" textAnchor="end">
                        {minFasting.toFixed(1)}
                    </text>
                </svg>
            </div>

            <p className="text-xs text-muted-foreground">
                Viser kveldsdose (enheter, under) og neste morgens fastende (linje). Basert på {completePairs.length} par.
            </p>

            {/* Dose range breakdown */}
            {avgFastingByDoseRange.length > 1 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gjennomsnitt per doseintervall</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {avgFastingByDoseRange.map(({ doseRange, avgFasting, count }) => (
                            <div key={doseRange} className="bg-muted/50 rounded-lg px-3 py-2">
                                <div className="text-xs text-violet-600 dark:text-violet-400 font-medium">{doseRange} E</div>
                                <div className="text-sm font-bold">
                                    {avgFasting.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">mmol/L</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">{count} målinger</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestion */}
            {suggestion && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">{suggestion}</p>
                </div>
            )}

            <p className="text-[10px] text-muted-foreground italic">
                Denne oversikten er kun til informasjon. Diskuter alltid doseendringer med lege eller jordmor.
            </p>
        </div>
    );
}
