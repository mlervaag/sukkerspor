"use client";

interface CoverageCardProps {
    fastingDays: number;
    postMealDays: number;
}

export function CoverageCard({ fastingDays, postMealDays }: CoverageCardProps) {
    return (
        <div className="card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dekning denne uken
            </h3>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm">Fastende</span>
                    <span className="font-semibold">{fastingDays}/7 dager</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(fastingDays / 7) * 100}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm">Etter måltid</span>
                    <span className="font-semibold">{postMealDays}/7 dager</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(postMealDays / 7) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
