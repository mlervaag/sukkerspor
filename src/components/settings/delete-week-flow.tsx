"use client";

import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { format, startOfWeek, endOfWeek, getISOWeek, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

export function DeleteWeekFlow() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [loading, setLoading] = useState(false);

    // Compute week details for UI
    const weekInfo = useMemo(() => {
        if (!date) return null;
        try {
            const d = parseISO(date);
            const weekNum = getISOWeek(d);
            const start = startOfWeek(d, { weekStartsOn: 1 });
            const end = endOfWeek(d, { weekStartsOn: 1 });
            return {
                weekNum,
                label: `Uke ${weekNum} (${format(start, "d.MM")} – ${format(end, "d.MM.yyyy")})`
            };
        } catch {
            return null;
        }
    }, [date]);

    async function handleDelete() {
        setLoading(true);
        // We pass the date, API will calculate the start of week
        try {
            const res = await fetch(`/api/readings/bulk?week=${date}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            alert(`Slettet alle målinger for uke ${weekInfo?.weekNum}.`);
            setIsConfirmOpen(false);
        } catch (err) {
            console.error(err);
            alert("Kunne ikke slette data.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input flex-1"
                    />
                    <button
                        onClick={() => setIsConfirmOpen(true)}
                        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                {weekInfo && (
                    <p className="text-xs text-muted-foreground ml-1">
                        Valgt: <span className="font-medium text-foreground">{weekInfo.label}</span>
                    </p>
                )}
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title={`Slett data for uke ${weekInfo?.weekNum || "?"}`}
                message={`Er du sikker på at du vil slette ALLE målinger for ${weekInfo?.label}? Dette kan ikke angres.`}
                confirmText="Slett uke"
                isDestructive
                loading={loading}
            />
        </div>
    );
}
