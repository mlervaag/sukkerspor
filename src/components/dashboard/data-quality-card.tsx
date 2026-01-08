"use client";

import { AlertCircle } from "lucide-react";

interface DataQualityCardProps {
    missingTypeCount: number;
}

export function DataQualityCard({ missingTypeCount }: DataQualityCardProps) {
    if (missingTypeCount === 0) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs text-muted-foreground">
            <AlertCircle size={14} className="text-slate-500" />
            <span>
                {missingTypeCount} {missingTypeCount === 1 ? "måling" : "målinger"} mangler type (fastende/etter måltid)
            </span>
        </div>
    );
}
