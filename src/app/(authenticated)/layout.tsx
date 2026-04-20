import { BottomNav } from "@/components/ui/bottom-nav";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToastProvider>
            <div className="flex flex-col min-h-screen">
                <main className="flex-1 pb-24">
                    <div className="max-w-md mx-auto p-4">
                        {children}
                    </div>
                </main>
                <BottomNav />
            </div>
        </ToastProvider>
    );
}
