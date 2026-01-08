import { NextRequest, NextResponse } from "next/server";
import { createReading, listReadingsByWeek } from "@/lib/domain/reading";
import { parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date");
        const date = dateStr ? parseISO(dateStr) : new Date();

        const readings = await listReadingsByWeek(date);

        return NextResponse.json(readings, {
            headers: {
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const input = await req.json();
        const reading = await createReading(input);

        return NextResponse.json(reading, {
            status: 201,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Failed to create reading:", error);
        return NextResponse.json({ error: "Failed to create reading" }, { status: 400 });
    }
}
