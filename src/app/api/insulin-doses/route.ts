import { NextRequest, NextResponse } from "next/server";
import { createInsulinDose, listInsulinDosesByDayKeyRange } from "@/lib/domain/insulin-dose";
import { validateInsulinDoseInput, ValidationError } from "@/lib/domain/validation";

export const dynamic = "force-dynamic";

const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const startDayKey = searchParams.get("startDayKey");
        const endDayKey = searchParams.get("endDayKey");

        if (!startDayKey || !endDayKey) {
            return NextResponse.json({ error: "startDayKey and endDayKey are required" }, { status: 400 });
        }

        if (!DAY_KEY_REGEX.test(startDayKey) || !DAY_KEY_REGEX.test(endDayKey)) {
            return NextResponse.json({ error: "Invalid dayKey format" }, { status: 400 });
        }

        if (startDayKey > endDayKey) {
            return NextResponse.json({ error: "startDayKey must be <= endDayKey" }, { status: 400 });
        }

        const doses = await listInsulinDosesByDayKeyRange(startDayKey, endDayKey);
        return NextResponse.json(doses, {
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch (error) {
        console.error("Failed to fetch insulin doses:", error);
        return NextResponse.json({ error: "Failed to fetch insulin doses" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const raw = await req.json();
        const input = validateInsulinDoseInput(raw);
        const dose = await createInsulinDose(input);

        return NextResponse.json(dose, {
            status: 201,
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("Failed to create insulin dose:", error);
        return NextResponse.json({ error: "Kunne ikke lagre insulindose" }, { status: 500 });
    }
}
