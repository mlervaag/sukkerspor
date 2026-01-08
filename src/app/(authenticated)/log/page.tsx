"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { ReadingCard } from "@/components/log/reading-card";
import { ReadingModal } from "@/components/log/reading-modal";
import { GlucoseReading, ReadingInput } from "@/lib/domain/types";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogPage() {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReading, setSelectedReading] = useState<GlucoseReading | null>(null);

    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });

    const { data: readings, mutate } = useSWR<GlucoseReading[]>(
        `/api/readings?date=${start.toISOString()}`,
        fetcher
    );

    const daysInWeek = eachDayOfInterval({ start, end });

    const handleCreate = async (input: ReadingInput) => {
        await fetch("/api/readings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        mutate();
    };

    const handleUpdate = async (input: ReadingInput) => {
        if (!selectedReading) return;
        await fetch(`/api/readings/${selectedReading.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        mutate();
    };

    const openEdit = (reading: GlucoseReading) => {
        setSelectedReading(reading);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setSelectedReading(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Logg</h1>
                    <p className="text-muted-foreground">Uke {format(currentWeek, "w", { locale: nb })}</p>
                </div>
                <button
                    onClick={openAdd}
                    className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </header>

            <div className="flex items-center justify-between bg-card p-2 rounded-2xl border border-border">
                <button
                    onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="font-medium">
                    {format(start, "d. MMM", { locale: nb })} – {format(end, "d. MMM", { locale: nb })}
                </span>
                <button
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            <div className="space-y-8">
                {daysInWeek.map((day) => {
                    const dayReadings = readings?.filter((r) => isSameDay(new Date(r.measuredAt), day)) || [];
                    const isToday = isSameDay(day, new Date());

                    return (
                        <section key={day.toISOString()} className="space-y-3">
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                                {format(day, "eeee d. MMMM", { locale: nb })}
                                {isToday && <span className="ml-2 text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">IDAG</span>}
                            </h2>

                            <div className="space-y-3">
                                {dayReadings.length > 0 ? (
                                    dayReadings.map((reading) => (
                                        <ReadingCard
                                            key={reading.id}
                                            reading={reading}
                                            onClick={() => openEdit(reading)}
                                        />
                                    ))
                                ) : (
                                    <div className="card text-center text-xs text-muted-foreground py-6 border-dashed">
                                        Ingen målinger logget
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>

            <ReadingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={selectedReading ? handleUpdate : handleCreate}
                initialData={selectedReading}
            />
        </div>
    );
}
