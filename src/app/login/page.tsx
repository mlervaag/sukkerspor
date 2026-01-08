"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/log");
                router.refresh();
            } else {
                setError("Feil passord. Vennligst prøv igjen.");
            }
        } catch (err) {
            setError("Noe gikk galt. Prøv igjen senere.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        Blodsukker
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Logg inn for å fortsette
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Passord"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input w-full"
                            autoFocus
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? "Logger inn..." : "Logg inn"}
                    </button>
                </form>
            </div>
        </div>
    );
}
