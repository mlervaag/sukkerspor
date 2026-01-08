import { ExportButton } from "@/components/settings/export-button";
import { ImportFlow } from "@/components/settings/import-flow";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-primary">Innstillinger</h1>
                <p className="text-muted-foreground">App og data</p>
            </header>

            <div className="space-y-4">
                <div className="card space-y-4">
                    <h2 className="font-semibold">Eksport og import</h2>
                    <p className="text-sm text-muted-foreground">
                        Ta vare på dataene dine eller flytt dem til en annen enhet.
                        Import vil erstatte all gjeldende data.
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        <ExportButton />
                        <ImportFlow />
                    </div>
                </div>

                <div className="card">
                    <h2 className="font-semibold mb-1">Farlig område</h2>
                    <p className="text-sm text-muted-foreground italic">
                        Sletting kommer i Iterasjon 5.
                    </p>
                </div>
            </div>
        </div>
    );
}
