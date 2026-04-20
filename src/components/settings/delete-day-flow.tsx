"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "../ui/toast";

export function DeleteDayFlow() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    async function handleDelete() {
        setLoading(true);
        try {
            const res = await fetch(`/api/readings/bulk?dayKey=${date}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            const readable = format(new Date(date), "d. MMMM yyyy", { locale: nb });
            toast.success(`Slettet alle oppføringer for ${readable}`);
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
                    <label htmlFor="delete-day-date" className="text-sm font-medium text-muted-foreground block">
                        Velg dato
                    </label>
                    <input
                        id="delete-day-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input w-full"
                    />
                </div>

                <button
                    onClick={() => setIsConfirmOpen(true)}
                    className="btn-destructive w-full flex items-center justify-center gap-2"
                >
                    <Trash2 size={18} />
                    Slett dag {format(new Date(date), "dd.MM.yyyy")}
                </button>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Slett data for dag"
                message={`Er du sikker på at du vil slette ALLE målinger og insulindoser for ${format(new Date(date), "d. MMMM yyyy", { locale: nb })}? Dette kan ikke angres.`}
                confirmText="Slett dag"
                isDestructive
                loading={loading}
            />
        </div>
    );
}
