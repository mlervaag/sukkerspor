import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                success: {
                    DEFAULT: "var(--success)",
                    muted: "var(--success-muted)",
                },
                warning: {
                    DEFAULT: "var(--warning)",
                    muted: "var(--warning-muted)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    muted: "var(--destructive-muted)",
                },
                border: "var(--border)",
            },
            borderRadius: {
                xl: "0.75rem",
                "2xl": "1rem",
            },
        },
    },
    plugins: [],
};
export default config;
