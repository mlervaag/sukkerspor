"use client";

interface CoverageCardProps {
    fastingDays: number;
    postMealDays: number;
}

export function CoverageCard({ fastingDays, postMealDays }: CoverageCardProps) {
    const fCapped = Math.min(fastingDays, 7);
    const pCapped = Math.min(postMealDays, 7);

    return (
        <div className="card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dekning siste 7 dager
            </h3>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm">Fastende</span>
                    <span className="font-semibold">{fCapped}/7 dager</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                        className="bg-primary/90 dark:bg-primary rounded-full h-2.5 transition-all"
                        style={{ width: `${(fCapped / 7) * 100}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm">Etter m&aring;ltid</span>
                    <span className="font-semibold text-sm">{pCapped}/7 dager</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                        className="bg-primary/90 dark:bg-primary rounded-full h-2.5 transition-all"
                        style={{ width: `${(pCapped / 7) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
