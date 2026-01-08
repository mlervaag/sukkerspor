"use client";

import { Modal } from "./modal";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    loading?: boolean;
    requireText?: string;
    typedText?: string;
    onTypedTextChange?: (text: string) => void;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Bekreft",
    cancelText = "Avbryt",
    isDestructive = false,
    loading = false,
    requireText,
    typedText,
    onTypedTextChange,
}: ConfirmDialogProps) {
    const isConfirmDisabled = loading || (requireText !== undefined && typedText !== requireText);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-6 space-y-6">
                <p className="text-muted-foreground">{message}</p>

                {requireText && (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">
                            Skriv inn <span className="font-mono text-primary">&quot;{requireText}&quot;</span> for å bekrefte:
                        </label>
                        <input
                            type="text"
                            value={typedText || ""}
                            onChange={(e) => onTypedTextChange?.(e.target.value)}
                            placeholder={requireText}
                            className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                            autoFocus
                        />
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1"
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn-primary flex-1 ${isDestructive ? "bg-red-600 hover:bg-red-700 border-red-600" : ""
                            }`}
                        disabled={isConfirmDisabled}
                    >
                        {loading ? "Vennligst vent..." : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
