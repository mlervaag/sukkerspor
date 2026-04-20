"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "../ui/toast";

export function ExportButton() {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    async function handleExport() {
        setLoading(true);
        try {
            const res = await fetch("/api/backup/export");
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const disposition = res.headers.get("Content-Disposition");
            const filenameMatch = disposition?.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : "sukkerspor_backup.json";

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Backup lastet ned");
        } catch (error) {
            console.error(error);
            toast.error("Kunne ikke eksportere data");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="btn-secondary w-full flex items-center justify-center gap-2"
        >
            <Download size={18} />
            {loading ? "Eksporterer..." : "Last ned backup (JSON)"}
        </button>
    );
}
