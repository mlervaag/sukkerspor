"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ReadingInput, GlucoseReading } from "@/lib/domain/types";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { DeleteReadingButton } from "./delete-reading-button";
import { combineDateAndTime } from "@/lib/utils/date-time";

interface ReadingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ReadingInput) => Promise<void>;
    initialData?: GlucoseReading | null;
    selectedDate?: Date | null;
}

export function ReadingModal({ isOpen, onClose, onSubmit, initialData, selectedDate }: ReadingModalProps) {
    const [value, setValue] = useState("");
    const [time, setTime] = useState(format(new Date(), "HH:mm"));
    const [isFasting, setIsFasting] = useState(false);
    const [isPostMeal, setIsPostMeal] = useState(false);
    const [mealType, setMealType] = useState("");
    const [partOfDay, setPartOfDay] = useState("");
    const [foodText, setFoodText] = useState("");
    const [feelingNotes, setFeelingNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setValue(initialData.valueMmolL.toString());
            setTime(format(new Date(initialData.measuredAt), "HH:mm"));
            setIsFasting(initialData.isFasting);
            setIsPostMeal(initialData.isPostMeal);
            setMealType(initialData.mealType || "");
            setPartOfDay(initialData.partOfDay || "");
            setFoodText(initialData.foodText || "");
            setFeelingNotes(initialData.feelingNotes || "");
            setError(null);
        } else {
            resetForm();
        }
    }, [initialData, isOpen, selectedDate]);

    const resetForm = () => {
        setValue("");
        setTime(format(new Date(), "HH:mm"));
        setIsFasting(false);
        setIsPostMeal(false);
        setMealType("");
        setPartOfDay("");
        setFoodText("");
        setFeelingNotes("");
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const dateToUse = initialData ? new Date(initialData.measuredAt) : (selectedDate || new Date());
        const dateStr = format(dateToUse, "yyyy-MM-dd");
        const combinedDate = combineDateAndTime(dateStr, time);

        if (!value) {
            setError("Skriv inn en verdi.");
            return;
        }

        // Handle comma input by replacing with dot, though type="number" usually dictates dot.
        // We use value directly which is state string.
        const numericValue = parseFloat(value.replace(",", "."));

        if (isNaN(numericValue)) {
            setError("Ugyldig verdi.");
            return;
        }

        if (numericValue <= 0 || numericValue > 25.0) {
            setError("Verdien virker uvanlig. Sjekk at den er riktig.");
            return;
        }

        if (!combinedDate) {
            setError("Ugyldig tidspunkt (muligens pga. sommertid-overgang).");
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            await onSubmit({
                valueMmolL: numericValue.toFixed(1), // Normalize to 1 decimal
                measuredAt: combinedDate,
                isFasting,
                isPostMeal,
                mealType: mealType || null,
                partOfDay: partOfDay || null,
                foodText: foodText || null,
                feelingNotes: feelingNotes || null,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Noe gikk galt ved lagring.");
        } finally {
            setLoading(false);
        }
    };

    const activeDate = initialData ? new Date(initialData.measuredAt) : (selectedDate || new Date());

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${initialData ? "Rediger" : "Ny"} måling – ${format(activeDate, "eeee d. MMM", { locale: nb })}`}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Verdi (mmol/L)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(null);
                        }}
                        className="input w-full text-2xl font-bold placeholder:text-muted-foreground/30"
                        placeholder="0.0"
                        required
                        autoFocus
                    />
                    {/* Inline error for value */}
                    {!initialData && value === "" && (
                        <p className="text-xs text-muted-foreground">Skriv inn en verdi.</p>
                    )}
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

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => { setIsFasting(!isFasting); if (!isFasting) setIsPostMeal(false); }}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${isFasting ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"
                            }`}
                    >
                        Fastende
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsPostMeal(!isPostMeal); if (!isPostMeal) setIsFasting(false); }}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${isPostMeal ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"
                            }`}
                    >
                        Etter måltid
                    </button>
                </div>

                {isPostMeal && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Måltid
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["Frokost", "Lunsj", "Middag", "Kveldsmat", "Mellommåltid"].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMealType(m)}
                                    className={`px-4 py-2 rounded-full border text-sm transition-all ${mealType === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isPostMeal && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Hva spiste du?
                        </label>
                        <input
                            type="text"
                            value={foodText}
                            onChange={(e) => setFoodText(e.target.value)}
                            className="input w-full"
                            placeholder="F.eks. brød med ost, kaffe..."
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Notater
                    </label>
                    <textarea
                        value={feelingNotes}
                        onChange={(e) => setFeelingNotes(e.target.value)}
                        className="input w-full min-h-[100px] resize-none"
                        placeholder="Hvordan føler du deg? Stress, søvn, aktivitet..."
                    />
                </div>

                <div className="flex gap-3 mt-8">
                    {initialData && (
                        <DeleteReadingButton
                            readingId={initialData.id}
                            onDeleted={() => {
                                onClose();
                                // We might need a full refresh or rely on SWR revalidation
                                window.location.reload();
                            }}
                        />
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 py-4 text-lg"
                    >
                        {loading ? "Lagrer..." : "Lagre måling"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
