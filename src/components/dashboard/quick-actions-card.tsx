"use client";

import { Plus, FileText } from "lucide-react";

interface QuickActionsCardProps {
    onAddReading: () => void;
    onGenerateReport: () => void;
}

export function QuickActionsCard({ onAddReading, onGenerateReport }: QuickActionsCardProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={onAddReading}
                className="btn-primary py-4 flex flex-col items-center justify-center gap-2 rounded-2xl shadow-sm active:scale-[0.98] transition-all"
            >
                <Plus size={24} />
                <span className="text-sm font-semibold">Ny måling</span>
            </button>
            <button
                onClick={onGenerateReport}
                className="bg-card border border-border py-4 flex flex-col items-center justify-center gap-2 rounded-2xl text-primary shadow-sm active:scale-[0.98] transition-all"
            >
                <FileText size={24} />
                <span className="text-sm font-semibold">Generer rapport</span>
            </button>
        </div>
    );
}
