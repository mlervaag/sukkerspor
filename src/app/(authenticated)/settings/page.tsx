export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-primary">Innstillinger</h1>
                <p className="text-muted-foreground">App og data</p>
            </header>

            <div className="space-y-4">
                <div className="card">
                    <h2 className="font-semibold mb-1">Eksport og import</h2>
                    <p className="text-sm text-muted-foreground italic">
                        Kommer i Iterasjon 4.
                    </p>
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
