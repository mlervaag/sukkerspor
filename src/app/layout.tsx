import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Blodsukker",
    description: "Loggføring for svangerskapsdiabetes",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="no">
            <body>{children}</body>
        </html>
    );
}
