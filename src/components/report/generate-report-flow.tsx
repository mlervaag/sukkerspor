"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import useSWR from "swr";
import { UserSettings } from "@/lib/domain/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Checkbox({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label htmlFor={id} className="flex items-center gap-2 cursor-pointer select-none">
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm">{label}</span>
        </label>
    );
}

export function GenerateReportFlow() {
    const { data: settings } = useSWR<UserSettings>("/api/settings", fetcher);
    const [range, setRange] = useState("week");
    const [lang, setLang] = useState("no");
    const [loading, setLoading] = useState(false);

    // Content options
    const [includeReadings, setIncludeReadings] = useState(true);
    const [includeMeals, setIncludeMeals] = useState(true);
    const [includeNotes, setIncludeNotes] = useState(true);
    const [includeInsulin, setIncludeInsulin] = useState(true);
    const [includeExtStats, setIncludeExtStats] = useState(true);

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
        const params = new URLSearchParams({
            range,
            lang,
            readings: includeReadings ? "1" : "0",
            meals: includeMeals ? "1" : "0",
            notes: includeNotes ? "1" : "0",
            insulin: includeInsulin ? "1" : "0",
            extStats: includeExtStats ? "1" : "0",
        });
        const url = `/api/report/pdf?${params.toString()}`;

        const link = document.createElement("a");
        link.href = url;
        link.download = `rapport.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

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
                        <option value="month">Siste m&aring;ned</option>
                        <option value="all">Alle data</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Spr&aring;k</label>
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

            <div className="space-y-2">
                <label className="text-sm font-medium">Innhold i rapporten</label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-muted/50 rounded-xl">
                    <Checkbox id="rpt-readings" label="Blodsukker-m&aring;linger" checked={includeReadings} onChange={setIncludeReadings} />
                    <Checkbox id="rpt-meals" label="M&aring;ltidsinformasjon" checked={includeMeals} onChange={setIncludeMeals} />
                    <Checkbox id="rpt-notes" label="Notater / f&oslash;lelser" checked={includeNotes} onChange={setIncludeNotes} />
                    <Checkbox id="rpt-insulin" label="Insulindoser" checked={includeInsulin} onChange={setIncludeInsulin} />
                    <Checkbox id="rpt-extstats" label="Detaljert statistikk" checked={includeExtStats} onChange={setIncludeExtStats} />
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
