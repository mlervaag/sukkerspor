import { NextRequest, NextResponse } from "next/server";
import { updateReading } from "@/lib/domain/reading";
import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logEvent } from "@/lib/domain/event-log";
import { validatePartialReadingInput, ValidationError } from "@/lib/domain/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch (error) {
        console.error("Failed to fetch reading:", error);
        return NextResponse.json({ error: "Failed to fetch reading" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    try {
        const raw = await req.json();
        const input = validatePartialReadingInput(raw);
        await updateReading(id, input);

        return NextResponse.json({ success: true }, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("Update reading failed:", error);
        return NextResponse.json({ error: "Kunne ikke oppdatere måling" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const reading = await db.query.glucoseReadings.findFirst({
            where: eq(glucoseReadings.id, id),
        });

        if (!reading) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await db.transaction(async (tx) => {
            await tx.delete(glucoseReadings).where(eq(glucoseReadings.id, id));
            await logEvent("delete", "glucose_reading", id, {
                measuredAt: reading.measuredAt,
                value: reading.valueMmolL,
            });
        });

        return NextResponse.json({ success: true }, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Delete failed:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
