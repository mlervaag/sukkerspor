"use client";

import { Plus, FileText, Syringe } from "lucide-react";

interface QuickActionsCardProps {
    onAddReading: () => void;
    onAddInsulin: () => void;
    onGenerateReport: () => void;
}

export function QuickActionsCard({ onAddReading, onAddInsulin, onGenerateReport }: QuickActionsCardProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <button
                onClick={onAddReading}
                className="btn-primary py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl shadow-sm active:scale-[0.98] transition-all"
            >
                <Plus size={22} />
                <span className="text-sm font-semibold">Ny måling</span>
            </button>
            <button
                onClick={onAddInsulin}
                className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl text-violet-700 dark:text-violet-300 shadow-sm hover:bg-violet-100 dark:hover:bg-violet-900/30 active:scale-[0.98] transition-all"
            >
                <Syringe size={22} />
                <span className="text-sm font-semibold">Insulin</span>
            </button>
            <button
                onClick={onGenerateReport}
                className="bg-card border border-border py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl text-primary shadow-sm hover:bg-muted/50 active:scale-[0.98] transition-all"
            >
                <FileText size={22} />
                <span className="text-sm font-semibold">Rapport</span>
            </button>
        </div>
    );
}
