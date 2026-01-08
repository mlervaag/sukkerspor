"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { UserSettings, UserSettingsInput } from "@/lib/domain/types";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ProfileCard() {
    const { data: settings, mutate } = useSWR<UserSettings>("/api/settings", fetcher);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [dueDate, setDueDate] = useState("");
    const [diagnosisDate, setDiagnosisDate] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (settings) {
            setDueDate(settings.dueDate ? format(new Date(settings.dueDate), "yyyy-MM-dd") : "");
            setDiagnosisDate(settings.diagnosisDate ? format(new Date(settings.diagnosisDate), "yyyy-MM-dd") : "");
            setNotes(settings.notes || "");
        }
    }, [settings]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dueDate: dueDate || null,
                    diagnosisDate: diagnosisDate || null,
                    notes: notes || null,
                } as UserSettingsInput),
            });

            if (!res.ok) throw new Error("Kunne ikke lagre");

            await mutate();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert("Noe gikk galt ved lagring.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="card space-y-4">
            <h2 className="font-semibold">Min profil</h2>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">
                        Termindato
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="input w-full"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">
                        Diagnosedato
                    </label>
                    <input
                        type="date"
                        value={diagnosisDate}
                        onChange={(e) => setDiagnosisDate(e.target.value)}
                        className="input w-full"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">
                        Notater
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input w-full min-h-[80px] text-sm py-2"
                        placeholder="Kort informasjon om din situasjon..."
                    />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                    {success && (
                        <span className="text-sm text-green-600 font-medium animate-in fade-in slide-in-from-left-2">
                            Lagret!
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary ml-auto py-2 px-6 h-auto text-sm"
                    >
                        {loading ? "Lagrer..." : "Lagre profil"}
                    </button>
                </div>
            </form>
        </section>
    );
}
