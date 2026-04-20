"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    show: (message: string, variant?: ToastVariant) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);
    const timeoutsRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
    const nextIdRef = useRef(1);

    useEffect(() => {
        setMounted(true);
        const timeouts = timeoutsRef.current;
        return () => {
            timeouts.forEach((t) => clearTimeout(t));
            timeouts.clear();
        };
    }, []);

    const dismiss = useCallback((id: number) => {
        const handle = timeoutsRef.current.get(id);
        if (handle) {
            clearTimeout(handle);
            timeoutsRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const show = useCallback((message: string, variant: ToastVariant = "info") => {
        const id = nextIdRef.current++;
        setToasts((prev) => [...prev, { id, message, variant }]);
        const handle = setTimeout(() => dismiss(id), 4000);
        timeoutsRef.current.set(id, handle);
    }, [dismiss]);

    const value: ToastContextValue = {
        show,
        success: (message) => show(message, "success"),
        error: (message) => show(message, "error"),
        info: (message) => show(message, "info"),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {mounted && createPortal(
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    style={{ top: "max(1rem, env(safe-area-inset-top))" }}
                    className="fixed left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
                >
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const styles = {
        success: "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
        error: "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
        info: "bg-card border-border text-foreground",
    }[toast.variant];

    const Icon = toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? AlertCircle : Info;
    const iconColor = toast.variant === "success" ? "text-green-600 dark:text-green-400" : toast.variant === "error" ? "text-red-600 dark:text-red-400" : "text-primary";

    return (
        <div
            role={toast.variant === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur animate-in fade-in slide-in-from-top-4 duration-200 ${styles}`}
        >
            <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
                onClick={onDismiss}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Lukk melding"
            >
                <X size={16} />
            </button>
        </div>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return ctx;
}
