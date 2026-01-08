import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";
import { eq, and, between } from "drizzle-orm";
import { logEvent } from "@/lib/domain/event-log";
import { startOfWeek, endOfWeek, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dayKey = searchParams.get("dayKey");
        const week = searchParams.get("week");
        const all = searchParams.get("all") === "true";

        if (all) {
            await db.transaction(async (tx) => {
                await tx.delete(glucoseReadings);
                await logEvent("delete", "glucose_reading", undefined, { scope: "all" });
            });
            return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
        }

        if (dayKey) {
            await db.transaction(async (tx) => {
                await tx.delete(glucoseReadings).where(eq(glucoseReadings.dayKey, dayKey));
                await logEvent("delete", "glucose_reading", undefined, { scope: "day", dayKey });
            });
            return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
        }

        if (week) {
            const date = parseISO(week);
            const start = startOfWeek(date, { weekStartsOn: 1 });
            const end = endOfWeek(date, { weekStartsOn: 1 });

            await db.transaction(async (tx) => {
                await tx.delete(glucoseReadings).where(between(glucoseReadings.measuredAt, start, end));
                await logEvent("delete", "glucose_reading", undefined, { scope: "week", week });
            });
            return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        console.error("Bulk delete failed:", error);
        return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
    }
}
