"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek } from "date-fns";
import { nb } from "date-fns/locale";
import { ReadingCard } from "@/components/log/reading-card";
import { ReadingModal } from "@/components/log/reading-modal";
import { InsulinDoseCard } from "@/components/log/insulin-dose-card";
import { InsulinDoseModal } from "@/components/log/insulin-dose-modal";
import { GlucoseReading, ReadingInput, InsulinDose, InsulinDoseInput } from "@/lib/domain/types";
import { ChevronLeft, ChevronRight, Plus, Syringe } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TimelineItem =
    | { type: "reading"; time: Date; data: GlucoseReading }
    | { type: "insulin"; time: Date; data: InsulinDose };

export default function LogPage() {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsulinModalOpen, setIsInsulinModalOpen] = useState(false);
    const [selectedReading, setSelectedReading] = useState<GlucoseReading | null>(null);
    const [selectedDose, setSelectedDose] = useState<InsulinDose | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });

    const weekStartDayKey = format(start, "yyyy-MM-dd");
    const weekEndDayKey = format(end, "yyyy-MM-dd");

    const { data: readings, mutate: mutateReadings } = useSWR<GlucoseReading[]>(
        `/api/readings?weekStartDayKey=${weekStartDayKey}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    const { data: insulinDoses, mutate: mutateInsulin } = useSWR<InsulinDose[]>(
        `/api/insulin-doses?startDayKey=${weekStartDayKey}&endDayKey=${weekEndDayKey}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    const daysInWeek = eachDayOfInterval({ start, end });

    // Reading handlers
    const handleCreateReading = async (input: ReadingInput) => {
        const res = await fetch("/api/readings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Kunne ikke opprette måling");
        }
        mutateReadings();
    };

    const handleUpdateReading = async (input: ReadingInput) => {
        if (!selectedReading) return;
        const res = await fetch(`/api/readings/${selectedReading.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Kunne ikke oppdatere måling");
        }
        mutateReadings();
    };

    // Insulin handlers
    const handleCreateInsulin = async (input: InsulinDoseInput) => {
        const res = await fetch("/api/insulin-doses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Kunne ikke opprette insulindose");
        }
        mutateInsulin();
    };

    const handleUpdateInsulin = async (input: InsulinDoseInput) => {
        if (!selectedDose) return;
        const res = await fetch(`/api/insulin-doses/${selectedDose.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Kunne ikke oppdatere insulindose");
        }
        mutateInsulin();
    };

    const handleDeleteInsulin = async (id: string) => {
        const res = await fetch(`/api/insulin-doses/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Kunne ikke slette insulindose");
        mutateInsulin();
    };

    const openEditReading = (reading: GlucoseReading) => {
        setSelectedReading(reading);
        setIsModalOpen(true);
    };

    const openAddReading = (day: Date) => {
        setSelectedReading(null);
        setSelectedDay(day);
        setIsModalOpen(true);
    };

    const openEditInsulin = (dose: InsulinDose) => {
        setSelectedDose(dose);
        setIsInsulinModalOpen(true);
    };

    const openAddInsulin = (day: Date) => {
        setSelectedDose(null);
        setSelectedDay(day);
        setIsInsulinModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Logg</h1>
                    <p className="text-muted-foreground">Uke {format(currentWeek, "w", { locale: nb })}</p>
                </div>
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
                    const dayKeyStr = format(day, "yyyy-MM-dd");
                    const dayReadings = readings?.filter((r) => r.dayKey === dayKeyStr) || [];
                    const dayDoses = insulinDoses?.filter((d) => d.dayKey === dayKeyStr) || [];
                    const isToday = format(new Date(), "yyyy-MM-dd") === dayKeyStr;

                    // Merge into timeline sorted by time
                    const timeline: TimelineItem[] = [
                        ...dayReadings.map((r) => ({ type: "reading" as const, time: new Date(r.measuredAt), data: r })),
                        ...dayDoses.map((d) => ({ type: "insulin" as const, time: new Date(d.administeredAt), data: d })),
                    ].sort((a, b) => a.time.getTime() - b.time.getTime());

                    const hasEntries = timeline.length > 0;

                    // Day summary calculations
                    const lastReading = dayReadings.length > 0 ? dayReadings[dayReadings.length - 1] : null;
                    const hasHighReading = dayReadings.some((r) => {
                        const val = parseFloat(r.valueMmolL);
                        if (r.isFasting) return val > 5.3;
                        if (r.isPostMeal) return val > 6.7;
                        return false;
                    });

                    return (
                        <section key={dayKeyStr} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className={`text-sm font-bold uppercase tracking-widest ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                                        {format(day, "eeee d. MMMM", { locale: nb })}
                                        {isToday && <span className="ml-2 text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">IDAG</span>}
                                    </h2>
                                    {hasEntries && (
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            {dayReadings.length > 0 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                                    {dayReadings.length} {dayReadings.length === 1 ? "måling" : "målinger"}
                                                </span>
                                            )}
                                            {dayDoses.length > 0 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300">
                                                    {dayDoses.length} {dayDoses.length === 1 ? "dose" : "doser"}
                                                </span>
                                            )}
                                            {lastReading && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                                    Siste {format(new Date(lastReading.measuredAt), "HH:mm")}
                                                </span>
                                            )}
                                            {hasHighReading && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">
                                                    Over referanse
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {hasEntries && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openAddInsulin(day)}
                                            className="p-1 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                                            title="Legg til insulin"
                                        >
                                            <Syringe size={18} />
                                        </button>
                                        <button
                                            onClick={() => openAddReading(day)}
                                            className="p-1 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                            title="Legg til måling"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {hasEntries ? (
                                    timeline.map((item) =>
                                        item.type === "reading" ? (
                                            <ReadingCard
                                                key={item.data.id}
                                                reading={item.data as GlucoseReading}
                                                onClick={() => openEditReading(item.data as GlucoseReading)}
                                            />
                                        ) : (
                                            <InsulinDoseCard
                                                key={item.data.id}
                                                dose={item.data as InsulinDose}
                                                onClick={() => openEditInsulin(item.data as InsulinDose)}
                                            />
                                        )
                                    )
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => openAddReading(day)}
                                            className="card flex-1 text-center py-8 border-dashed border-2 bg-transparent hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary">
                                                <Plus size={24} className="opacity-50 group-hover:opacity-100" />
                                                <span className="text-xs font-medium">Ny måling</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => openAddInsulin(day)}
                                            className="card flex-1 text-center py-8 border-dashed border-2 bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 transition-all group"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                                <Syringe size={24} className="opacity-50 group-hover:opacity-100" />
                                                <span className="text-xs font-medium">Ny insulindose</span>
                                            </div>
                                        </button>
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
                onSubmit={selectedReading ? handleUpdateReading : handleCreateReading}
                initialData={selectedReading}
                selectedDate={selectedDay}
            />

            <InsulinDoseModal
                isOpen={isInsulinModalOpen}
                onClose={() => setIsInsulinModalOpen(false)}
                onSubmit={selectedDose ? handleUpdateInsulin : handleCreateInsulin}
                onDelete={handleDeleteInsulin}
                initialData={selectedDose}
                selectedDate={selectedDay}
            />
        </div>
    );
}
