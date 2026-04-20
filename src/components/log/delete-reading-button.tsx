"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useToast } from "../ui/toast";

interface DeleteReadingButtonProps {
    readingId: string;
    onDeleted: () => void;
}

export function DeleteReadingButton({ readingId, onDeleted }: DeleteReadingButtonProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    async function handleDelete() {
        setLoading(true);
        try {
            const res = await fetch(`/api/readings/${readingId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            setIsConfirmOpen(false);
            toast.success("Måling slettet");
            onDeleted();
        } catch (err) {
            console.error(err);
            toast.error("Kunne ikke slette målingen");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="text-red-600 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors"
            >
                <Trash2 size={18} />
                Slett måling
            </button>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Slett måling"
                message="Er du sikker på at du vil slette denne målingen? Dette kan ikke angres."
                confirmText="Slett"
                isDestructive
                loading={loading}
            />
        </>
    );
}
