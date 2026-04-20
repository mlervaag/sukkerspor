"use client";

import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, getISOWeek, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "../ui/toast";

export function DeleteWeekFlow() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    const weekInfo = useMemo(() => {
        if (!date) return null;
        try {
            const d = parseISO(date);
            if (isNaN(d.getTime())) return null;
            const weekNum = getISOWeek(d);
            const start = startOfWeek(d, { weekStartsOn: 1 });
            const end = endOfWeek(d, { weekStartsOn: 1 });
            return {
                weekNum,
                label: `Uke ${weekNum} (${format(start, "d.MM")} – ${format(end, "d.MM.yyyy")})`,
            };
        } catch {
            return null;
        }
    }, [date]);

    async function handleDelete() {
        setLoading(true);
        try {
            const res = await fetch(`/api/readings/bulk?week=${date}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            toast.success(`Slettet alle oppføringer for uke ${weekInfo?.weekNum}`);
            setIsConfirmOpen(false);
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Kunne ikke slette data");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            <div className="space-y-4 pt-2">
                <div className="space-y-2">
                    <label htmlFor="delete-week-date" className="text-sm font-medium text-muted-foreground block">
                        Velg uke som skal slettes
                    </label>
                    <div className="relative">
                        <input
                            id="delete-week-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="input w-full opacity-0 absolute inset-0 z-10 cursor-pointer"
                        />
                        <div className="input w-full flex items-center justify-between text-left cursor-pointer bg-background">
                            <span className={!weekInfo ? "text-muted-foreground" : ""}>
                                {weekInfo ? weekInfo.label : "Velg uke (trykk her)"}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={!weekInfo || loading}
                    className="btn-destructive w-full flex items-center justify-center gap-2"
                >
                    <Trash2 size={18} />
                    Slett data for uke {weekInfo?.weekNum || "?"}
                </button>

                {weekInfo && (
                    <p className="text-xs text-muted-foreground text-center">
                        Sletter alle målinger og insulindoser i {weekInfo.label}. Kan ikke angres.
                    </p>
                )}

                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleDelete}
                    title={`Slett data for uke ${weekInfo?.weekNum || "?"}`}
                    message={`Er du sikker på at du vil slette ALLE målinger og insulindoser for ${weekInfo?.label}? Dette kan ikke angres.`}
                    confirmText="Slett uke"
                    isDestructive
                    loading={loading}
                />
            </div>
        </div>
    );
}
