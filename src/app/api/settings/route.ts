import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/domain/settings";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings, {
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const input = await req.json();

        // Transform date strings to Date objects for Drizzle
        // This fixes "e.toISOString is not a function" crash on Vercel
        const transformedInput = {
            ...input,
            dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === "" ? null : input.dueDate,
            diagnosisDate: input.diagnosisDate ? new Date(input.diagnosisDate) : input.diagnosisDate === "" ? null : input.diagnosisDate,
        };

        const settings = await updateSettings(transformedInput);
        return NextResponse.json(settings, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Update settings failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
