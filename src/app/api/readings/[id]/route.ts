import { NextRequest, NextResponse } from "next/server";
import { updateReading } from "@/lib/domain/reading";
import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logEvent } from "@/lib/domain/event-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Required for transaction support

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

        return NextResponse.json({ success: true }, {
            headers: { "Cache-Control": "no-store" }
        });
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        // Fetch for logging before deletion
        const reading = await db.query.glucoseReadings.findFirst({
            where: eq(glucoseReadings.id, id)
        });

        if (!reading) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Transactional delete + log for atomicity
        await db.transaction(async (tx) => {
            await tx.delete(glucoseReadings).where(eq(glucoseReadings.id, id));
            await logEvent("delete", "glucose_reading", id, {
                measuredAt: reading.measuredAt,
                value: reading.valueMmolL
            });
        });

        return NextResponse.json({ success: true }, {
            headers: { "Cache-Control": "no-store" }
        });
    } catch (error) {
        console.error("Delete failed:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
