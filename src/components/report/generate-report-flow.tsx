"use client";

import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import useSWR from "swr";
import { UserSettings } from "@/lib/domain/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GenerateReportFlow() {
    const { data: settings } = useSWR<UserSettings>("/api/settings", fetcher);
    const [range, setRange] = useState("week");
    const [lang, setLang] = useState("no");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (settings?.reportLanguage) {
            setLang(settings.reportLanguage);
        }
    }, [settings]);

    const handleLangChange = async (newLang: string) => {
        setLang(newLang);
        try {
            await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reportLanguage: newLang }),
            });
        } catch (err) {
            console.error("Failed to save language preference:", err);
        }
    };

    const handleGenerate = () => {
        setLoading(true);
        const url = `/api/report/pdf?range=${range}&lang=${lang}`;


        // Use a hidden anchor to trigger download
        const link = document.createElement("a");
        link.href = url;
        link.download = `rapport.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Since it's a direct download, we don't have a callback for "done"
        // so we just reset after a short delay
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Periode</label>
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="input w-full"
                    >
                        <option value="week">Siste uke</option>
                        <option value="month">Siste måned</option>
                        <option value="all">Alle data</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Språk</label>
                    <select
                        value={lang}
                        onChange={(e) => handleLangChange(e.target.value)}
                        className="input w-full"
                    >
                        <option value="no">Norsk</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
                {loading ? (
                    "Genererer..."
                ) : (
                    <>
                        <FileText size={20} />
                        Lag PDF-rapport
                    </>
                )}
            </button>
        </div>
    );
}
