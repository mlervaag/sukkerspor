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
import { WithinTargetCard } from "@/components/dashboard/within-target-card";
import { HighLowStatsCard } from "@/components/dashboard/high-low-stats-card";
import { DataQualityCard } from "@/components/dashboard/data-quality-card";
import { GoalStatusCard } from "@/components/dashboard/goal-status-card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OverviewPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [windowDays, setWindowDays] = useState<7 | 14>(14);

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
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Oversikt</h1>
                    <p className="text-muted-foreground">Din status for {windowDays === 7 ? "siste 7 dager" : "siste 14 dager"}</p>
                </div>

                {/* Time Window Segmented Control */}
                <div className="bg-muted p-1 rounded-lg inline-flex self-start sm:self-center">
                    <button
                        onClick={() => setWindowDays(7)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${windowDays === 7 ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        7 dager
                    </button>
                    <button
                        onClick={() => setWindowDays(14)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${windowDays === 14 ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        14 dager
                    </button>
                </div>
            </header>

            {!stats ? (
                <div className="space-y-4 animate-pulse">
                    <div className="card h-28 bg-muted/20" />
                    <div className="card h-40 bg-muted/20" />
                </div>
            ) : (
                <>
                    {/* Top Section: Status & Actions */}
                    <div className="space-y-4">
                        {/* 1. Last Reading (Primary Context) */}
                        <LastReadingCard lastReading={readings && readings.length > 0 ? readings[readings.length - 1] : null} />

                        {/* 2. Quick Actions (Directly below Last Reading) */}
                        <QuickActionsCard
                            onAddReading={() => setIsModalOpen(true)}
                            onGenerateReport={() => router.push("/settings")}
                        />

                        {/* 3. Success/Prompt State (Feedback on action) */}
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
                    </div>

                    {/* Analytics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Målstatus - Reactive to Window */}
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

                        {/* High/Low - Kept as 7d for recent extremes context */}
                        <HighLowStatsCard
                            fasting7d={stats.highLow.fasting7d}
                            postMeal7d={stats.highLow.postMeal7d}
                        />

                        {/* Coverage - Only relevant for 7d completeness anyway */}
                        <CoverageCard
                            fastingDays={stats.coverageFasting}
                            postMealDays={stats.coveragePostMeal}
                        />

                        {/* Trend Grid */}
                        <TrendSparklineCard
                            data={trendStats.data}
                            label={trendStats.label}
                        />
                    </div>

                    {/* Meal Breakdown Widget (Full Width) */}
                    <MealBreakdownCard meals={mealStats} />

                    {/* Quality Warning (Conditional, low priority) */}
                    <DataQualityCard missingTypeCount={stats.qualityMissingTypeCount} />

                    {/* Last 3 Readings List */}
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
