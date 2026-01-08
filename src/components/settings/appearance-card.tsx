"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function AppearanceCard() {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    return (
        <section className="card space-y-4">
            <h2 className="font-semibold">Utseende</h2>
            <p className="text-sm text-muted-foreground">
                Velg mellom lyst og mørkt tema.
            </p>
            <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {theme === "light" ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-400" />}
                    <span className="font-medium">{theme === "light" ? "Lyst tema" : "Mørkt tema"}</span>
                </div>
                <div className="w-12 h-6 bg-muted rounded-full relative transition-colors">
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform bg-primary ${theme === "dark" ? "translate-x-6" : ""}`} />
                </div>
            </button>
        </section>
    );
}
