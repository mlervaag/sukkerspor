"use client";

import { ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    subValue?: string;
    icon?: ReactNode;
    color?: "primary" | "success" | "warning" | "danger";
}

export function StatCard({ label, value, unit, subValue, icon, color = "primary" }: StatCardProps) {
    const colorMap = {
        primary: "text-primary",
        success: "text-green-600",
        warning: "text-amber-600",
        danger: "text-red-600",
    };

    return (
        <div className="card space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                {icon && <div className="text-muted-foreground opacity-50">{icon}</div>}
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${colorMap[color]}`}>{value}</span>
                {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
            </div>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
    );
}
