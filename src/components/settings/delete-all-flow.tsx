"use client";

import { useState } from "react";
import { Trash2, AlertOctagon } from "lucide-react";
import { ConfirmDialog } from "../ui/confirm-dialog";

export function DeleteAllFlow() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [typedText, setTypedText] = useState("");
    const [loading, setLoading] = useState(false);

    const PHRASE = "SLETT ALT";

    async function handleDelete() {
        if (typedText !== PHRASE) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/readings/bulk?all=true`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            alert(`All data er slettet.`);
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Kunne ikke slette data.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <button
                onClick={() => setIsConfirmOpen(true)}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 w-full flex items-center justify-center gap-2"
            >
                <AlertOctagon size={18} />
                Slett all data irreversibelt
            </button>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => { setIsConfirmOpen(false); setTypedText(""); }}
                onConfirm={handleDelete}
                title="EKSTREM ADVARSEL: Slett alt"
                message="Dette vil slette ALLE blodsukkermålinger og all historikk permanent. Denne handlingen kan overhodet ikke angres."
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
