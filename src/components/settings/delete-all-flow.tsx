"use client";

import { useState } from "react";
import { AlertOctagon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "../ui/toast";

const PHRASE = "SLETT ALT";

export function DeleteAllFlow() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [typedText, setTypedText] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    async function handleDelete() {
        if (typedText !== PHRASE) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/readings/bulk?all=true`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            setIsConfirmOpen(false);
            setTypedText("");
            toast.success("All data er slettet");
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Kunne ikke slette data");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <button
                onClick={() => setIsConfirmOpen(true)}
                className="btn-destructive w-full flex items-center justify-center gap-2"
            >
                <AlertOctagon size={18} />
                Slett all data irreversibelt
            </button>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => { setIsConfirmOpen(false); setTypedText(""); }}
                onConfirm={handleDelete}
                title="EKSTREM ADVARSEL: Slett alt"
                message="Dette vil slette ALLE blodsukkermålinger og insulindoser permanent. Denne handlingen kan overhodet ikke angres."
                confirmText="Slett alt permanent"
                isDestructive
                loading={loading}
                requireText={PHRASE}
                typedText={typedText}
                onTypedTextChange={setTypedText}
            />
        </div>
    );
}
