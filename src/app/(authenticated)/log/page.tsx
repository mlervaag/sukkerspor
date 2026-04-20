"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { ReadingCard } from "@/components/log/reading-card";
import { ReadingModal } from "@/components/log/reading-modal";
import { InsulinDoseCard } from "@/components/log/insulin-dose-card";
import { InsulinDoseModal } from "@/components/log/insulin-dose-modal";
import { GlucoseReading, ReadingInput, InsulinDose, InsulinDoseInput } from "@/lib/domain/types";
import { ChevronLeft, ChevronRight, Plus, Syringe, Filter } from "lucide-react";
import { THRESHOLDS } from "@/lib/domain/analytics";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TimelineItem =
    | { type: "reading"; time: Date; data: GlucoseReading }
    | { type: "insulin"; time: Date; data: InsulinDose };

type LogFilter = "fasting" | "postMeal" | "insulin";

const FILTERS: { key: LogFilter; label: string; active: string }[] = [
    { key: "fasting", label: "Fastende", active: "bg-primary text-primary-foreground" },
    { key: "postMeal", label: "Etter måltid", active: "bg-primary text-primary-foreground" },
    { key: "insulin", label: "Insulin", active: "bg-violet-600 text-white" },
];

export default function LogPage() {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsulinModalOpen, setIsInsulinModalOpen] = useState(false);
    const [selectedReading, setSelectedReading] = useState<GlucoseReading | null>(null);
    const [selectedDose, setSelectedDose] = useState<InsulinDose | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [activeFilters, setActiveFilters] = useState<Set<LogFilter>>(new Set(["fasting", "postMeal", "insulin"]));
    const toast = useToast();

    const start = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
    const end = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);

    const weekStartDayKey = format(start, "yyyy-MM-dd");
    const weekEndDayKey = format(end, "yyyy-MM-dd");

    const { data: readings, mutate: mutateReadings } = useSWR<GlucoseReading[]>(
        `/api/readings?startDayKey=${weekStartDayKey}&endDayKey=${weekEndDayKey}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    const { data: insulinDoses, mutate: mutateInsulin } = useSWR<InsulinDose[]>(
        `/api/insulin-doses?startDayKey=${weekStartDayKey}&endDayKey=${weekEndDayKey}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    const daysInWeek = useMemo(() => eachDayOfInterval({ start, end }), [start, end]);

    const readingsByDay = useMemo(() => {
        const map = new Map<string, GlucoseReading[]>();
        readings?.forEach((r) => {
            const arr = map.get(r.dayKey) ?? [];
            arr.push(r);
            map.set(r.dayKey, arr);
        });
        return map;
    }, [readings]);

    const dosesByDay = useMemo(() => {
        const map = new Map<string, InsulinDose[]>();
        insulinDoses?.forEach((d) => {
            const arr = map.get(d.dayKey) ?? [];
            arr.push(d);
            map.set(d.dayKey, arr);
        });
        return map;
    }, [insulinDoses]);

    const handleCreateReading = async (input: ReadingInput) => {
        const res = await fetch("/api/readings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Kunne ikke opprette måling");
        }
        await mutateReadings();
        toast.success("Måling registrert");
    };

    const handleUpdateReading = async (input: ReadingInput) => {
        if (!selectedReading) return;
        const res = await fetch(`/api/readings/${selectedReading.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Kunne ikke oppdatere måling");
        }
        await mutateReadings();
        toast.success("Måling oppdatert");
    };

    const handleCreateInsulin = async (input: InsulinDoseInput) => {
        const res = await fetch("/api/insulin-doses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Kunne ikke opprette insulindose");
        }
        await mutateInsulin();
        toast.success("Insulindose lagret");
    };

    const handleUpdateInsulin = async (input: InsulinDoseInput) => {
        if (!selectedDose) return;
        const res = await fetch(`/api/insulin-doses/${selectedDose.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Kunne ikke oppdatere insulindose");
        }
        await mutateInsulin();
        toast.success("Insulindose oppdatert");
    };

    const handleDeleteInsulin = async (id: string) => {
        const res = await fetch(`/api/insulin-doses/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Kunne ikke slette insulindose");
        await mutateInsulin();
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

    const toggleFilter = (filter: LogFilter) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(filter)) {
                if (next.size > 1) next.delete(filter);
            } else {
                next.add(filter);
            }
            return next;
        });
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

    const weekHasAnyEntries = (readings?.length ?? 0) + (insulinDoses?.length ?? 0) > 0;

    return (
        <div className="space-y-6 pb-4">
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
                    aria-label="Forrige uke"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="font-medium">
                    {format(start, "d. MMM", { locale: nb })} – {format(end, "d. MMM", { locale: nb })}
                </span>
                <button
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Neste uke"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            <div className="flex items-center gap-2" role="group" aria-label="Filter">
                <Filter size={14} className="text-muted-foreground shrink-0" />
                {FILTERS.map(({ key, label, active }) => {
                    const isActive = activeFilters.has(key);
                    return (
                        <button
                            key={key}
                            onClick={() => toggleFilter(key)}
                            aria-pressed={isActive}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${isActive ? active : "bg-muted text-muted-foreground opacity-60"}`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {!weekHasAnyEntries && readings && insulinDoses && (
                <div className="card text-center py-8 space-y-3 bg-muted/20">
                    <p className="text-sm font-medium">Ingen oppføringer denne uken</p>
                    <p className="text-xs text-muted-foreground">Legg til målinger eller insulindoser nedenfor.</p>
                </div>
            )}

            <div className="space-y-8">
                {daysInWeek.map((day) => {
                    const dayKeyStr = format(day, "yyyy-MM-dd");
                    const allDayReadings = readingsByDay.get(dayKeyStr) ?? [];
                    const allDayDoses = dosesByDay.get(dayKeyStr) ?? [];

                    const dayReadings = allDayReadings.filter((r) => {
                        if (r.isFasting && activeFilters.has("fasting")) return true;
                        if (r.isPostMeal && activeFilters.has("postMeal")) return true;
                        if (!r.isFasting && !r.isPostMeal) return activeFilters.has("fasting") || activeFilters.has("postMeal");
                        return false;
                    });
                    const dayDoses = activeFilters.has("insulin") ? allDayDoses : [];
                    const isToday = isSameDay(day, new Date());

                    const timeline: TimelineItem[] = [
                        ...dayReadings.map((r) => ({ type: "reading" as const, time: new Date(r.measuredAt), data: r })),
                        ...dayDoses.map((d) => ({ type: "insulin" as const, time: new Date(d.administeredAt), data: d })),
                    ].sort((a, b) => a.time.getTime() - b.time.getTime());

                    const hasEntries = timeline.length > 0;
                    const hasAnyData = allDayReadings.length > 0 || allDayDoses.length > 0;

                    const lastReading = dayReadings.length > 0 ? dayReadings[dayReadings.length - 1] : null;
                    const hasHighReading = dayReadings.some((r) => {
                        const val = parseFloat(r.valueMmolL);
                        if (r.isFasting) return val > THRESHOLDS.FASTING;
                        if (r.isPostMeal) return val > THRESHOLDS.POST_MEAL;
                        return false;
                    });

                    return (
                        <section key={dayKeyStr} className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <h2 className={`text-sm font-bold uppercase tracking-widest ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                                        {format(day, "eeee d. MMMM", { locale: nb })}
                                        {isToday && <span className="ml-2 text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">I DAG</span>}
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
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                                    Over referanse
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {hasAnyData && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openAddInsulin(day)}
                                            className="p-1 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                                            aria-label={`Legg til insulin for ${format(day, "d. MMMM", { locale: nb })}`}
                                        >
                                            <Syringe size={18} />
                                        </button>
                                        <button
                                            onClick={() => openAddReading(day)}
                                            className="p-1 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                            aria-label={`Legg til måling for ${format(day, "d. MMMM", { locale: nb })}`}
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
                                                reading={item.data}
                                                onClick={() => openEditReading(item.data)}
                                            />
                                        ) : (
                                            <InsulinDoseCard
                                                key={item.data.id}
                                                dose={item.data}
                                                onClick={() => openEditInsulin(item.data)}
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
                onDeleted={() => mutateReadings()}
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
