"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { GlucoseReading, ReadingInput, InsulinDose, InsulinDoseInput } from "@/lib/domain/types";
import { computeDashboardStats, computeMealBreakdown, computeDailyTrends, computeInsulinFastingCorrelation } from "@/lib/domain/analytics";
import { CoverageCard } from "@/components/dashboard/coverage-card";
import { MealBreakdownCard } from "@/components/dashboard/meal-breakdown-card";
import { TrendSparklineCard } from "@/components/dashboard/trend-sparkline-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { ReadingModal } from "@/components/log/reading-modal";
import { InsulinDoseModal } from "@/components/log/insulin-dose-modal";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { getOverviewQueryRange } from "@/lib/utils/query-params";
import { LastReadingCard } from "@/components/dashboard/last-reading-card";
import { HighLowStatsCard } from "@/components/dashboard/high-low-stats-card";
import { DataQualityCard } from "@/components/dashboard/data-quality-card";
import { GoalStatusCard } from "@/components/dashboard/goal-status-card";
import { InsulinCorrelationCard } from "@/components/dashboard/insulin-correlation-card";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OverviewPage() {
    const router = useRouter();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsulinModalOpen, setIsInsulinModalOpen] = useState(false);
    const [windowDays, setWindowDays] = useState<7 | 14>(14);

    const [{ startDayKey, endDayKey }] = useState(() => getOverviewQueryRange());
    const [today] = useState(() => startOfDay(new Date()));
    const start7d = useMemo(() => subDays(today, 6), [today]);

    const { data: readings, isLoading: readingsLoading, mutate } = useSWR<GlucoseReading[]>(
        `/api/readings?startDayKey=${startDayKey}&endDayKey=${endDayKey}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    const { data: insulinDoses, mutate: mutateInsulin } = useSWR<InsulinDose[]>(
        `/api/insulin-doses?startDayKey=${startDayKey}&endDayKey=${endDayKey}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    const readings7d = useMemo(() => {
        if (!readings) return [];
        return readings.filter((r) => isAfter(new Date(r.measuredAt), startOfDay(start7d)));
    }, [readings, start7d]);

    const stats = useMemo(() => (readings ? computeDashboardStats(readings, readings7d) : null), [readings, readings7d]);
    const mealStats = useMemo(() => (readings ? computeMealBreakdown(readings) : []), [readings]);
    const trendStats = useMemo(() => computeDailyTrends(readings7d), [readings7d]);
    const correlationStats = useMemo(() => {
        if (!readings || !insulinDoses) return null;
        return computeInsulinFastingCorrelation(insulinDoses, readings);
    }, [readings, insulinDoses]);

    const hasAnyInsulin = (insulinDoses?.length ?? 0) > 0;
    const hasAnyReadings = (readings?.length ?? 0) > 0;

    const lastReading = useMemo(() => {
        if (!readings || readings.length === 0) return null;
        // Readings are sorted ascending by measuredAt, last element is newest.
        return readings[readings.length - 1];
    }, [readings]);

    const handleCreate = async (input: ReadingInput) => {
        const res = await fetch("/api/readings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Kunne ikke opprette måling");
        }
        await mutate();
        toast.success("Måling registrert");
    };

    const handleCreateInsulin = async (input: InsulinDoseInput) => {
        const res = await fetch("/api/insulin-doses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Kunne ikke lagre insulindose");
        }
        await mutate();
        await mutateInsulin();
        toast.success("Insulindose lagret");
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Oversikt</h1>
                    <p className="text-muted-foreground">Din status for {windowDays === 7 ? "siste 7 dager" : "siste 14 dager"}</p>
                </div>

                <div
                    role="tablist"
                    aria-label="Tidsperiode"
                    className="bg-muted p-1 rounded-lg inline-flex self-start sm:self-center"
                >
                    {([7, 14] as const).map((d) => (
                        <button
                            key={d}
                            role="tab"
                            aria-selected={windowDays === d}
                            onClick={() => setWindowDays(d)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${windowDays === d ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {d} dager
                        </button>
                    ))}
                </div>
            </header>

            {readingsLoading && !readings ? (
                <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Laster oversikt">
                    <div className="card h-28 bg-muted/20" />
                    <div className="card h-16 bg-muted/20" />
                    <div className="card h-40 bg-muted/20" />
                </div>
            ) : !hasAnyReadings ? (
                <EmptyState onAddReading={() => setIsModalOpen(true)} onAddInsulin={() => setIsInsulinModalOpen(true)} />
            ) : stats ? (
                <>
                    {/* 1. Siste måling (primær kontekst) */}
                    <LastReadingCard lastReading={lastReading} />

                    {/* 2. Quick actions (handling) */}
                    <QuickActionsCard
                        onAddReading={() => setIsModalOpen(true)}
                        onAddInsulin={() => setIsInsulinModalOpen(true)}
                        onGenerateReport={() => router.push("/settings#rapport")}
                    />

                    {/* 3. Dagens status (rask tilbakemelding) */}
                    {!stats.hasLoggedToday ? (
                        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 flex items-start gap-3">
                            <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={20} />
                            <div>
                                <p className="font-semibold text-amber-900 dark:text-amber-100">Ingen målinger i dag</p>
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    Du har ikke logget noen verdier for i dag ennå. Trykk på «Ny måling» for å starte.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="card relative overflow-hidden flex items-center gap-3 px-4 py-3 border-l-4 border-l-green-500">
                            <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                            <div>
                                <p className="text-sm font-semibold text-foreground">Godt jobbet!</p>
                                <p className="text-xs text-muted-foreground">
                                    Logget i dag. Siste: {stats.lastLoggedAt ? format(stats.lastLoggedAt, "HH:mm") : ""}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 4. Målstatus (hoved-KPI for gravide) */}
                    <GoalStatusCard
                        windowLabel={windowDays === 7 ? "7 dager" : "14 dager"}
                        fasting={windowDays === 7
                            ? (stats.withinTarget.fasting7d ? { ...stats.withinTarget.fasting7d, over: stats.overTargetBreakdown.fasting7d } : null)
                            : (stats.withinTarget.fasting14d ? { ...stats.withinTarget.fasting14d, over: stats.overTargetBreakdown.fasting14d } : null)
                        }
                        postMeal={windowDays === 7
                            ? (stats.withinTarget.postMeal7d ? { ...stats.withinTarget.postMeal7d, over: stats.overTargetBreakdown.postMeal7d } : null)
                            : (stats.withinTarget.postMeal14d ? { ...stats.withinTarget.postMeal14d, over: stats.overTargetBreakdown.postMeal14d } : null)
                        }
                    />

                    {/* 5. Trend (retning — blir det bedre eller verre?) */}
                    <TrendSparklineCard data={trendStats.data} label={trendStats.label} />

                    {/* 6. Fordeling per måltid (actionable mønster) */}
                    <MealBreakdownCard meals={mealStats} />

                    {/* 7. Insulin-korrelasjon (kun når relevant — actionable) */}
                    {hasAnyInsulin && correlationStats && (
                        <InsulinCorrelationCard correlation={correlationStats} />
                    )}

                    {/* 8. Dekning og høy/lav (motivasjon + detaljer) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CoverageCard
                            fastingDays={stats.coverageFasting}
                            postMealDays={stats.coveragePostMeal}
                        />
                        <HighLowStatsCard
                            fasting7d={stats.highLow.fasting7d}
                            postMeal7d={stats.highLow.postMeal7d}
                        />
                    </div>

                    {/* 9. Datakvalitet-varsel (kun når nødvendig) */}
                    <DataQualityCard missingTypeCount={stats.qualityMissingTypeCount} />

                    {/* Footer disclaimer */}
                    <footer className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-border">
                        <p>
                            Informasjonen og referanseverdiene som vises i denne appen er basert på
                            offentlig tilgjengelig informasjon fra Helsenorge og Diabetesforbundet.
                            De er ment som veiledning og erstatter ikke medisinsk rådgivning.
                        </p>
                        <p>
                            Din lege eller jordmor kan ha satt andre mål for deg basert på din
                            individuelle situasjon. Diskuter alltid dine målinger med helsepersonell.
                        </p>
                    </footer>
                </>
            ) : null}

            <ReadingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreate}
                initialData={null}
                selectedDate={null}
            />

            <InsulinDoseModal
                isOpen={isInsulinModalOpen}
                onClose={() => setIsInsulinModalOpen(false)}
                onSubmit={handleCreateInsulin}
            />
        </div>
    );
}

function EmptyState({ onAddReading, onAddInsulin }: { onAddReading: () => void; onAddInsulin: () => void }) {
    return (
        <div className="card text-center py-12 space-y-4 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="inline-flex p-3 bg-primary/10 text-primary rounded-full">
                <Sparkles size={32} />
            </div>
            <div className="space-y-1">
                <h2 className="text-xl font-bold">Velkommen!</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Logg din første blodsukkermåling for å komme i gang. Du får statistikk og mønstre etter hvert som du logger.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button onClick={onAddReading} className="btn-primary">Registrer måling</button>
                <button onClick={onAddInsulin} className="btn-secondary">Registrer insulin</button>
            </div>
        </div>
    );
}
