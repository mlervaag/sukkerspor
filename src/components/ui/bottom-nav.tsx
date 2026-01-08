"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
    { label: "Oversikt", href: "/", icon: LayoutDashboard },
    { label: "Logg", href: "/log", icon: History },
    { label: "Innstillinger", href: "/settings", icon: Settings },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-6 py-3 pb-8">
            <div className="flex items-center justify-between max-w-md mx-auto">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <div
                                className={cn(
                                    "p-1 rounded-xl transition-colors",
                                    isActive ? "bg-primary/10" : "bg-transparent"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-medium uppercase tracking-wider">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
