"use client";

import { useState, useRef } from "react";
import { Upload, AlertTriangle, FileJson, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "../ui/modal";
import { BackupData } from "@/lib/backup/schema";
import { useToast } from "../ui/toast";

export function ImportFlow() {
    const [preview, setPreview] = useState<BackupData | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "preview" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const toast = useToast();

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.schema_version !== 1 && json.schema_version !== 2) {
                    throw new Error(`Støtter ikke versjon ${json.schema_version}`);
                }
                if (!Array.isArray(json.readings)) {
                    throw new Error("Ugyldig backup: mangler målinger");
                }
                setPreview(json as BackupData);
                setStatus("preview");
            } catch (err) {
                setErrorMessage(err instanceof Error ? err.message : "Ugyldig filformat");
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
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Import feilet");
            }

            setStatus("success");
            toast.success("Data importert");
            setTimeout(() => {
                reset();
                router.refresh();
            }, 1200);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Noe gikk galt");
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

    const totalEntries = preview ? preview.readings.length + (preview.insulin_doses?.length ?? 0) : 0;

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
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 flex gap-3 text-amber-800 dark:text-amber-200">
                                    <AlertTriangle className="shrink-0" size={20} />
                                    <p className="text-sm">
                                        <strong>Advarsel:</strong> Import vil slette alle eksisterende målinger og insulindoser, og erstatte dem med data fra filen. Dette kan ikke angres.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Målinger</p>
                                        <p className="text-2xl font-bold">{preview.readings.length}</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Insulindoser</p>
                                        <p className="text-2xl font-bold">{preview.insulin_doses?.length ?? 0}</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg col-span-2">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Eksportert</p>
                                        <p className="font-semibold">{new Date(preview.exported_at).toLocaleDateString("nb-NO")}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={reset} className="btn-secondary flex-1" disabled={loading}>
                                        Avbryt
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="btn-destructive flex-1"
                                        disabled={loading || totalEntries === 0}
                                    >
                                        {loading ? "Importerer..." : "Bekreft og erstatt"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="text-center py-8 space-y-4">
                                <div className="inline-flex p-3 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 rounded-full">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h3 className="text-xl font-bold">Fullført!</h3>
                                <p className="text-muted-foreground">Data er importert.</p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-6">
                                <div role="alert" className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-900 flex gap-3">
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
