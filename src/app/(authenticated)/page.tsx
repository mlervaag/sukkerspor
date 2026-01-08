"use client";

import useSWR from "swr";
import { format, startOfWeek, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { GlucoseReading } from "@/lib/domain/types";
import { computeDashboardStats } from "@/lib/domain/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { History, Activity, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OverviewPage() {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });

    const { data: readings } = useSWR<GlucoseReading[]>(
        `/api/readings?date=${start.toISOString()}`,
        fetcher,
        { revalidateOnFocus: true }
    );

    const stats = readings ? computeDashboardStats(readings) : null;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-primary">Oversikt</h1>
                <p className="text-muted-foreground">Din status for denne uken</p>
            </header>

            {!stats ? (
                <div className="grid grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card h-28 bg-muted/20" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            label="Snitt Fastende"
                            value={stats.averageFasting?.toFixed(1) || "—"}
                            unit="mmol/L"
                            color={stats.averageFasting && stats.averageFasting > 5.3 ? "warning" : "success"}
                            icon={<Activity size={18} />}
                        />
                        <StatCard
                            label="Snitt Måltid"
                            value={stats.averagePostMeal?.toFixed(1) || "—"}
                            unit="mmol/L"
                            color={stats.averagePostMeal && stats.averagePostMeal > 6.7 ? "warning" : "success"}
                            icon={<TrendingUp size={18} />}
                        />
                        <StatCard
                            label="Fullført uke"
                            value={Math.round(stats.weekCompleteness * 100)}
                            unit="%"
                            subValue={`${Math.round(stats.weekCompleteness * 7)} av 7 dager logget`}
                            icon={<History size={18} />}
                        />
                        <StatCard
                            label="Innafor mål"
                            value={Math.round(stats.compliancePercentage)}
                            unit="%"
                            color={stats.compliancePercentage < 80 ? "warning" : "success"}
                            icon={<CheckCircle2 size={18} />}
                        />
                    </div>

                    {/* Prompt/Alert */}
                    {!stats.hasLoggedToday ? (
                        <div className="card bg-amber-50 border-amber-200 flex items-start gap-3">
                            <AlertCircle className="text-amber-600 mt-1 shrink-0" size={20} />
                            <div>
                                <p className="font-semibold text-amber-900">Mangler målinger i dag</p>
                                <p className="text-sm text-amber-800">Du har ikke logget noen verdier for i dag ennå.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card bg-green-50 border-green-200 flex items-start gap-3">
                            <CheckCircle2 className="text-green-600 mt-1 shrink-0" size={20} />
                            <div>
                                <p className="font-semibold text-green-900">Godt jobbet!</p>
                                <p className="text-sm text-green-800">Du har logget målinger for i dag. Siste måling: {stats.lastLoggedAt ? format(stats.lastLoggedAt, "HH:mm") : ""}</p>
                            </div>
                        </div>
                    )}

                    {/* Simple Trend/List summary */}
                    <div className="card space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Siste 3 målinger</h3>
                        <div className="space-y-3">
                            {readings?.slice(-3).reverse().map(r => (
                                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">{format(new Date(r.measuredAt), "eee d. MMM HH:mm", { locale: nb })}</span>
                                        <span className="text-sm font-medium">{r.isFasting ? "Fastende" : (r.mealType || "Etter måltid")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold">{r.valueMmolL}</span>
                                        <div className={`w-2 h-2 rounded-full ${(r.isFasting && parseFloat(r.valueMmolL) > 5.3) || (r.isPostMeal && parseFloat(r.valueMmolL) > 6.7)
                                            ? "bg-red-500" : "bg-green-500"
                                            }`} />
                                    </div>
                                </div>
                            ))}
                            {(!readings || readings.length === 0) && (
                                <p className="text-center text-muted-foreground py-4 italic">Ingen data tilgjengelig</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
