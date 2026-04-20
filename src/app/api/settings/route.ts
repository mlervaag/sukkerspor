import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/domain/settings";
import { validateSettingsInput, ValidationError } from "@/lib/domain/validation";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings, {
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const raw = await req.json();
        const validated = validateSettingsInput(raw);
        const settings = await updateSettings(validated);
        return NextResponse.json(settings, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("Update settings failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
