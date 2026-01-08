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
        const settings = await updateSettings(input);
        return NextResponse.json(settings, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Update settings failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
