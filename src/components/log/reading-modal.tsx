"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ReadingInput, GlucoseReading } from "@/lib/domain/types";
import { format } from "date-fns";

interface ReadingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ReadingInput) => Promise<void>;
    initialData?: GlucoseReading | null;
}

export function ReadingModal({ isOpen, onClose, onSubmit, initialData }: ReadingModalProps) {
    const [value, setValue] = useState("");
    const [measuredAt, setMeasuredAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [isFasting, setIsFasting] = useState(false);
    const [isPostMeal, setIsPostMeal] = useState(false);
    const [mealType, setMealType] = useState("");
    const [partOfDay, setPartOfDay] = useState("");
    const [foodText, setFoodText] = useState("");
    const [feelingNotes, setFeelingNotes] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setValue(initialData.valueMmolL.toString());
            setMeasuredAt(format(new Date(initialData.measuredAt), "yyyy-MM-dd'T'HH:mm"));
            setIsFasting(initialData.isFasting);
            setIsPostMeal(initialData.isPostMeal);
            setMealType(initialData.mealType || "");
            setPartOfDay(initialData.partOfDay || "");
            setFoodText(initialData.foodText || "");
            setFeelingNotes(initialData.feelingNotes || "");
        } else {
            resetForm();
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setValue("");
        setMeasuredAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        setIsFasting(false);
        setIsPostMeal(false);
        setMealType("");
        setPartOfDay("");
        setFoodText("");
        setFeelingNotes("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            await onSubmit({
                valueMmolL: value.replace(",", "."),
                measuredAt: new Date(measuredAt),
                isFasting,
                isPostMeal,
                mealType: mealType || null,
                partOfDay: partOfDay || null,
                foodText: foodText || null,
                feelingNotes: feelingNotes || null,
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Rediger måling" : "Ny måling"}
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
                        onChange={(e) => setValue(e.target.value)}
                        className="input w-full text-2xl font-bold"
                        placeholder="0.0"
                        required
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Tidspunkt
                    </label>
                    <input
                        type="datetime-local"
                        value={measuredAt}
                        onChange={(e) => setMeasuredAt(e.target.value)}
                        className="input w-full"
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
                            {["Frokost", "Lunsj", "Middag", "Kvelds", "Mellommåltid"].map((m) => (
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

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg mt-8"
                >
                    {loading ? "Lagrer..." : "Lagre måling"}
                </button>
            </form>
        </Modal>
    );
}
