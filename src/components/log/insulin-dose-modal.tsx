"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { InsulinDoseInput, InsulinDose } from "@/lib/domain/types";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { combineDateAndTime } from "@/lib/utils/date-time";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "../ui/confirm-dialog";

interface InsulinDoseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InsulinDoseInput) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: InsulinDose | null;
    selectedDate?: Date | null;
}

export function InsulinDoseModal({ isOpen, onClose, onSubmit, onDelete, initialData, selectedDate }: InsulinDoseModalProps) {
    const [doseUnits, setDoseUnits] = useState("");
    const [time, setTime] = useState(format(new Date(), "HH:mm"));
    const [insulinType, setInsulinType] = useState<"long_acting" | "rapid_acting">("long_acting");
    const [insulinName, setInsulinName] = useState("");
    const [mealContext, setMealContext] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setDoseUnits(initialData.doseUnits.toString());
            setTime(format(new Date(initialData.administeredAt), "HH:mm"));
            setInsulinType(initialData.insulinType as "long_acting" | "rapid_acting");
            setInsulinName(initialData.insulinName || "");
            setMealContext(initialData.mealContext || "");
            setNotes(initialData.notes || "");
            setError(null);
        } else {
            resetForm();
        }
    }, [initialData, isOpen, selectedDate]);

    const resetForm = () => {
        setDoseUnits("");
        setTime(format(new Date(), "HH:mm"));
        setInsulinType("long_acting");
        // Restore last used insulin name from localStorage
        if (typeof window !== "undefined") {
            setInsulinName(localStorage.getItem("sukkerspor_insulin_name") || "");
        } else {
            setInsulinName("");
        }
        setMealContext("");
        setNotes("");
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const dateToUse = initialData ? new Date(initialData.administeredAt) : (selectedDate || new Date());
        const dateStr = format(dateToUse, "yyyy-MM-dd");
        const combinedDate = combineDateAndTime(dateStr, time);

        if (!doseUnits) {
            setError("Skriv inn antall enheter.");
            return;
        }

        const numericDose = parseFloat(doseUnits.replace(",", "."));

        if (isNaN(numericDose)) {
            setError("Ugyldig verdi.");
            return;
        }

        if (numericDose <= 0 || numericDose > 200) {
            setError("Dosen virker uvanlig. Sjekk at den er riktig.");
            return;
        }

        if (!combinedDate) {
            setError("Ugyldig tidspunkt (muligens pga. sommertid-overgang).");
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            // Save insulin name to localStorage for next time
            if (insulinName && typeof window !== "undefined") {
                localStorage.setItem("sukkerspor_insulin_name", insulinName);
            }

            await onSubmit({
                doseUnits: numericDose.toFixed(1),
                administeredAt: combinedDate,
                insulinType,
                insulinName: insulinName || null,
                mealContext: insulinType === "rapid_acting" ? (mealContext || null) : null,
                notes: notes || null,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Noe gikk galt ved lagring.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !onDelete) return;
        setDeleteLoading(true);
        try {
            await onDelete(initialData.id);
            setIsConfirmDeleteOpen(false);
            onClose();
        } catch {
            alert("Kunne ikke slette insulindosen.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const activeDate = initialData ? new Date(initialData.administeredAt) : (selectedDate || new Date());

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${initialData ? "Rediger" : "Ny"} insulindose – ${format(activeDate, "eeee d. MMM", { locale: nb })}`}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Dose (enheter)
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={doseUnits}
                        onChange={(e) => {
                            setDoseUnits(e.target.value);
                            setError(null);
                        }}
                        className="input w-full text-2xl font-bold placeholder:text-muted-foreground/30"
                        placeholder="0"
                        required
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Tidspunkt
                    </label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="input w-full text-xl"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Insulintype
                    </label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setInsulinType("long_acting")}
                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${insulinType === "long_acting" ? "bg-violet-50 dark:bg-violet-900/30 border-violet-500 text-violet-700 dark:text-violet-300" : "border-border text-muted-foreground"
                                }`}
                        >
                            Langtidsvirkende
                        </button>
                        <button
                            type="button"
                            onClick={() => setInsulinType("rapid_acting")}
                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${insulinType === "rapid_acting" ? "bg-violet-50 dark:bg-violet-900/30 border-violet-500 text-violet-700 dark:text-violet-300" : "border-border text-muted-foreground"
                                }`}
                        >
                            Hurtigvirkende
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Insulinnavn (valgfritt)
                    </label>
                    <input
                        type="text"
                        value={insulinName}
                        onChange={(e) => setInsulinName(e.target.value)}
                        className="input w-full"
                        placeholder="F.eks. Insulatard, NovoRapid..."
                    />
                </div>

                {insulinType === "rapid_acting" && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Til måltid
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["Frokost", "Lunsj", "Middag", "Kveldsmat"].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMealContext(m)}
                                    className={`px-4 py-2 rounded-full border text-sm transition-all ${mealContext === m ? "bg-violet-600 text-white border-violet-600" : "border-border text-muted-foreground"
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Notater
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input w-full min-h-[80px] resize-none"
                        placeholder="Eventuelle notater..."
                    />
                </div>

                <div className="flex gap-3 mt-8">
                    {initialData && onDelete && (
                        <button
                            type="button"
                            onClick={() => setIsConfirmDeleteOpen(true)}
                            className="text-red-600 flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                        >
                            <Trash2 size={18} />
                            Slett
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 py-4 text-lg"
                    >
                        {loading ? "Lagrer..." : "Lagre insulindose"}
                    </button>
                </div>
            </form>

            <ConfirmDialog
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Slett insulindose"
                message="Er du sikker på at du vil slette denne insulindosen? Dette kan ikke angres."
                confirmText="Slett"
                isDestructive
                loading={deleteLoading}
            />
        </Modal>
    );
}
