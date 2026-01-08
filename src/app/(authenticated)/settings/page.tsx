import { ExportButton } from "@/components/settings/export-button";
import { ImportFlow } from "@/components/settings/import-flow";
import { DeleteDayFlow } from "@/components/settings/delete-day-flow";
import { DeleteWeekFlow } from "@/components/settings/delete-week-flow";
import { DeleteAllFlow } from "@/components/settings/delete-all-flow";
import { GenerateReportFlow } from "@/components/report/generate-report-flow";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-primary">Innstillinger</h1>
                <p className="text-muted-foreground">App og data</p>
            </header>

            <div className="space-y-4">
                <div className="card space-y-4">
                    <h2 className="font-semibold">Rapport</h2>
                    <p className="text-sm text-muted-foreground">
                        Last ned en PDF-rapport av dine målinger for å dele med legen din.
                    </p>
                    <GenerateReportFlow />
                </div>

                <div className="card space-y-4">
                    <h2 className="font-semibold">Sikkerhetskopi</h2>
                    <p className="text-sm text-muted-foreground">
                        Ta vare på dataene dine eller flytt dem til en annen enhet.
                        Import vil erstatte all gjeldende data.
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        <ExportButton />
                        <ImportFlow />
                    </div>
                </div>

                <div className="card space-y-6">
                    <h2 className="font-semibold text-red-600">Farlig område</h2>

                    <div className="space-y-4">
                        <section className="space-y-2">
                            <h3 className="text-sm font-medium">Slett data for en dag</h3>
                            <DeleteDayFlow />
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-sm font-medium">Slett data for en uke</h3>
                            <DeleteWeekFlow />
                        </section>

                        <div className="pt-4 border-t border-red-100">
                            <DeleteAllFlow />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
