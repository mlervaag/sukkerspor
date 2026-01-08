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
            <div className="flex items-center justify-between py-1">
                <span className="text-sm">Fastende</span>
                <span className="font-semibold text-sm">&lt; 5,3 mmol/L</span>
            </div>

            {/* Post-meal row */}
            <div className="flex items-center justify-between py-1">
                <span className="text-sm">Etter måltid</span>
                <span className="font-semibold text-sm">&lt; 6,7 mmol/L</span>
            </div>


        </div>
    );
}
