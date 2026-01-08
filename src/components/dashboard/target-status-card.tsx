"use client";

import { DashboardStats, THRESHOLDS } from "@/lib/domain/analytics";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface TargetStatusCardProps {
    stats: DashboardStats;
}

export function TargetStatusCard({ stats }: TargetStatusCardProps) {
    const fastingStatus = stats.averageFasting !== null
        ? stats.averageFasting > THRESHOLDS.FASTING ? "over" : "within"
        : null;
    const postMealStatus = stats.averagePostMeal !== null
        ? stats.averagePostMeal > THRESHOLDS.POST_MEAL ? "over" : "within"
        : null;

    return (
        <div className="card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Referanseverdier
            </h3>

            {/* Fasting row */}
            <div className="flex items-center justify-between">
                <span className="text-sm">Fastende</span>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">
                        {stats.averageFasting !== null
                            ? `${stats.averageFasting.toFixed(1)} mmol/L`
                            : "—"}
                    </span>
                    {fastingStatus === "within" && (
                        <CheckCircle2 size={16} className="text-green-600" />
                    )}
                    {fastingStatus === "over" && (
                        <AlertTriangle size={16} className="text-amber-600" />
                    )}
                </div>
            </div>

            {/* Post-meal row */}
            <div className="flex items-center justify-between">
                <span className="text-sm">Etter måltid</span>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">
                        {stats.averagePostMeal !== null
                            ? `${stats.averagePostMeal.toFixed(1)} mmol/L`
                            : "—"}
                    </span>
                    {postMealStatus === "within" && (
                        <CheckCircle2 size={16} className="text-green-600" />
                    )}
                    {postMealStatus === "over" && (
                        <AlertTriangle size={16} className="text-amber-600" />
                    )}
                </div>
            </div>

            {/* Reference line */}
            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                Referanse: fastende &lt; 5,3 · etter måltid &lt; 6,7 mmol/L
            </p>
        </div>
    );
}
