"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { nb } from "date-fns/locale";
import { GlucoseReading, ReadingInput } from "@/lib/domain/types";
import { computeDashboardStats, computeMealBreakdown, computeDailyTrends } from "@/lib/domain/analytics";
import { TargetStatusCard } from "@/components/dashboard/target-status-card";
import { OverTargetCountCard } from "@/components/dashboard/over-target-count-card";
import { CoverageCard } from "@/components/dashboard/coverage-card";
import { MealBreakdownCard } from "@/components/dashboard/meal-breakdown-card";
import { TrendSparklineCard } from "@/components/dashboard/trend-sparkline-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { ReadingModal } from "@/components/log/reading-modal";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { getOverviewQueryRange } from "@/lib/utils/query-params";
import { LastReadingCard } from "@/components/dashboard/last-reading-card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OverviewPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Stable anchor for SWR key - computed once on mount
    const [{ startDayKey, endDayKey }] = useState(() => getOverviewQueryRange());

    // We also need start7d for filtering - derive from the same anchor logic
    // start14d is technically the date passed to queryDate (which is subDays 14)
    // but for 7d filtering we want relative to "today"
    const [today] = useState(() => startOfDay(new Date()));
    const start7d = subDays(today, 7);
    const start14d = subDays(today, 14);

    const { data: readings, mutate } = useSWR<GlucoseReading[]>(
        `/api/readings?startDayKey=${startDayKey}&endDayKey=${endDayKey}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    // Filter for 7d subset
    const readings7d = readings?.filter(r =>
        isAfter(new Date(r.measuredAt), startOfDay(start7d))
    ) ?? [];

    const stats = readings ? computeDashboardStats(readings, readings7d) : null;
    const mealStats = readings ? computeMealBreakdown(readings) : [];
    const trendStats = readings7d ? computeDailyTrends(readings7d) : { data: [], label: null };

    const handleCreate = async (input: ReadingInput) => {
        const res = await fetch("/api/readings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Kunne ikke opprette måling");
        }
        mutate();
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-primary">Oversikt</h1>
                <p className="text-muted-foreground">Din status for de siste 14 dagene</p>
            </header>

            {!stats ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card h-28 bg-muted/20" />
                    ))}
                </div>
            ) : (
                <>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Target Status Widget (Static Reference) */}
                        <TargetStatusCard stats={stats} />

                        {/* New Last Reading Widget */}
                        <LastReadingCard lastReading={readings && readings.length > 0 ? readings[readings.length - 1] : null} />
                    </div>

                    {/* Over-Target Count Widget */}
                    <OverTargetCountCard
                        count7d={stats.overTargetCount7d}
                        count14d={stats.overTargetCount14d}
                    />

                    {/* Quick Actions */}
                    <QuickActionsCard
                        onAddReading={() => setIsModalOpen(true)}
                        onGenerateReport={() => router.push("/settings")}
                    />

                    {/* Coverage and Trend Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CoverageCard
                            fastingDays={stats.coverageFasting}
                            postMealDays={stats.coveragePostMeal}
                        />
                        <TrendSparklineCard
                            data={trendStats.data}
                            label={trendStats.label}
                        />
                    </div>

                    {/* Meal Breakdown Widget */}
                    <MealBreakdownCard meals={mealStats} />



                    {/* Prompt/Alert - Success State */}
                    {!stats.hasLoggedToday ? (
                        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 flex items-start gap-3">
                            <AlertCircle className="text-amber-600 mt-1 shrink-0" size={20} />
                            <div>
                                <p className="font-semibold text-amber-900 dark:text-amber-100">Ingen målinger i dag</p>
                                <p className="text-sm text-amber-800 dark:text-amber-200">Du har ikke logget noen verdier for i dag ennå. Trykk på &quot;Ny måling&quot; for å starte.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card relative overflow-hidden flex items-center gap-3 px-4 py-3 border-l-4 border-l-green-500">
                            <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                            <div>
                                <p className="text-sm font-semibold text-foreground">Godt jobbet!</p>
                                <p className="text-xs text-muted-foreground">Logget i dag. Siste: {stats.lastLoggedAt ? format(stats.lastLoggedAt, "HH:mm") : ""}</p>
                            </div>
                        </div>
                    )}

                    {/* Last 3 Readings */}
                    <div className="card space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Siste 3 målinger</h3>
                        <div className="space-y-3">
                            {readings && readings.length > 0 ? (
                                readings.slice(-3).reverse().map(r => (
                                    <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">{format(new Date(r.measuredAt), "eee d. MMM HH:mm", { locale: nb })}</span>
                                            <span className="text-sm font-medium">{r.isFasting ? "Fastende" : (r.mealType || "Etter måltid")}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold">{r.valueMmolL}</span>
                                            <div className={`w-2 h-2 rounded-full ${(r.isFasting && parseFloat(r.valueMmolL) > 5.3) || (r.isPostMeal && parseFloat(r.valueMmolL) > 6.7)
                                                ? "bg-amber-500" : "bg-green-500"
                                                }`} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-6 italic text-sm">
                                    Ingen loggførte målinger funnet for denne perioden.
                                </p>
                            )}
                        </div>
                    </div>

                    <ReadingModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleCreate}
                        initialData={null}
                        selectedDate={null}
                    />

                    {/* Footer Disclaimer */}
                    <footer className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-border">
                        {typeof window !== 'undefined' && window.location.search.includes('debug=1') && (
                            <div className="p-2 mb-4 bg-muted/50 rounded-lg font-mono text-[10px]">
                                <p>Debug: 14d from {start14d.toISOString().split('T')[0]}</p>
                                <p>Readings: {readings?.length || 0} total, {readings7d.length} in 7d</p>
                            </div>
                        )}
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
            )}
        </div>
    );
}
