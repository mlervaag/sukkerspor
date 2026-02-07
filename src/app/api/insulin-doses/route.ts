import { NextRequest, NextResponse } from "next/server";
import { createInsulinDose, listInsulinDosesByDayKeyRange } from "@/lib/domain/insulin-dose";

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
        const input = await req.json();
        const dose = await createInsulinDose(input);

        return NextResponse.json(dose, {
            status: 201,
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Failed to create insulin dose:", error);
        return NextResponse.json({ error: "Failed to create insulin dose" }, { status: 400 });
    }
}
