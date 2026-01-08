import { NextRequest, NextResponse } from "next/server";
import { updateReading } from "@/lib/domain/reading";
import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    try {
        const reading = await db.query.glucoseReadings.findFirst({
            where: eq(glucoseReadings.id, id),
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

export async function PUT(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    try {
        const input = await req.json();
        const reading = await updateReading(id, input);

        return NextResponse.json(reading, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update reading" }, { status: 400 });
    }
}

