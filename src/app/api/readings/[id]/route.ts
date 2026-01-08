import { NextRequest, NextResponse } from "next/server";
import { updateReading } from "@/lib/domain/reading";
import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const reading = await db.query.glucoseReadings.findFirst({
            where: eq(glucoseReadings.id, params.id),
        });

        if (!reading) {
            return NextResponse.json({ error: "Reading not found" }, { status: 404 });
        }

        return NextResponse.json(reading, {
            headers: {
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch reading" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const input = await req.json();
        const reading = await updateReading(params.id, input);

        return NextResponse.json(reading, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update reading" }, { status: 400 });
    }
}
