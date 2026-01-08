"use client";

import { useState, useRef } from "react";
import { Upload, AlertTriangle, FileJson, CheckCircle2 } from "lucide-react";
import { Modal } from "../ui/modal";
import { BackupData } from "@/lib/backup/schema";

export function ImportFlow() {
    const [preview, setPreview] = useState<BackupData | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "preview" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic check on schema_version before showing preview
                if (json.schema_version !== 1) {
                    throw new Error(`Støtter ikke versjon ${json.schema_version}`);
                }
                setPreview(json);
                setStatus("preview");
            } catch (err: any) {
                setErrorMessage(err.message || "Ugyldig filformat");
                setStatus("error");
            }
        };
        reader.readAsText(file);
    }

    async function handleConfirm() {
        if (!preview) return;
        setLoading(true);
        try {
            const res = await fetch("/api/backup/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preview),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Import feilet");
            }

            setStatus("success");
            // Reload after a short delay to see fresh data
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            setErrorMessage(err.message);
            setStatus("error");
        } finally {
            setLoading(false);
        }
    }

    const reset = () => {
        setPreview(null);
        setStatus("idle");
        setErrorMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-4">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary w-full flex items-center justify-center gap-2"
            >
                <Upload size={18} />
                Importer backup
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
            />

            {status !== "idle" && (
                <Modal isOpen={true} onClose={reset} title="Import">
                    <div className="p-6 space-y-6">
                        <header className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <FileJson size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Import</h2>
                                <p className="text-sm text-muted-foreground">Forhåndsvisning av backup</p>
                            </div>
                        </header>

                        {status === "preview" && preview && (
                            <div className="space-y-6">
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3 text-amber-800">
                                    <AlertTriangle className="shrink-0" size={20} />
                                    <p className="text-sm">
                                        <strong>Advarsel:</strong> Import vil slette alle eksisterende målinger og erstatte dem med data fra filen. Dette kan ikke angres.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Målinger</p>
                                        <p className="text-2xl font-bold">{preview.readings.length}</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Dato eksportert</p>
                                        <p className="font-semibold">{new Date(preview.exported_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={reset}
                                        className="btn-secondary flex-1"
                                        disabled={loading}
                                    >
                                        Avbryt
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="btn-primary flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                                        disabled={loading}
                                    >
                                        {loading ? "Importerer..." : "Bekreft og erstatt"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="text-center py-8 space-y-4">
                                <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h3 className="text-xl font-bold">Fullført!</h3>
                                <p className="text-muted-foreground">
                                    Data er importert. Siden lastes på nytt...
                                </p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-6">
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex gap-3">
                                    <AlertTriangle className="shrink-0" size={20} />
                                    <p className="text-sm font-medium">{errorMessage}</p>
                                </div>
                                <button onClick={reset} className="btn-primary w-full">Gå tilbake</button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
