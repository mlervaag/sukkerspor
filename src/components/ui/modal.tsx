"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
            <header className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-primary">{title}</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-muted-foreground active:bg-muted transition-colors"
                >
                    <X size={24} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pb-12">
                <div className="max-w-md mx-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
