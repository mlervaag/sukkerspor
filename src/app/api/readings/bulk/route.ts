import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { glucoseReadings, insulinDoses } from "@/lib/db/schema";
import { between, eq } from "drizzle-orm";
import { logEvent } from "@/lib/domain/event-log";
import { startOfWeek, endOfWeek, parseISO, format } from "date-fns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dayKey = searchParams.get("dayKey");
        const week = searchParams.get("week");
        const all = searchParams.get("all") === "true";

        if (all) {
            await db.transaction(async (tx) => {
                await tx.delete(insulinDoses);
                await tx.delete(glucoseReadings);
                await logEvent("delete", "glucose_reading", undefined, { scope: "all" });
                await logEvent("delete", "insulin_dose", undefined, { scope: "all" });
            });
            return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
        }

        if (dayKey) {
            if (!DAY_KEY_REGEX.test(dayKey)) {
                return NextResponse.json({ error: "Invalid dayKey format" }, { status: 400 });
            }
            await db.transaction(async (tx) => {
                await tx.delete(insulinDoses).where(eq(insulinDoses.dayKey, dayKey));
                await tx.delete(glucoseReadings).where(eq(glucoseReadings.dayKey, dayKey));
                await logEvent("delete", "glucose_reading", undefined, { scope: "day", dayKey });
            });
            return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
        }

        if (week) {
            if (!DAY_KEY_REGEX.test(week)) {
                return NextResponse.json({ error: "Invalid week format (YYYY-MM-DD)" }, { status: 400 });
            }
            const date = parseISO(week);
            if (isNaN(date.getTime())) {
                return NextResponse.json({ error: "Invalid week date" }, { status: 400 });
            }
            const startDayKey = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
            const endDayKey = format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");

            await db.transaction(async (tx) => {
                await tx.delete(insulinDoses).where(between(insulinDoses.dayKey, startDayKey, endDayKey));
                await tx.delete(glucoseReadings).where(between(glucoseReadings.dayKey, startDayKey, endDayKey));
                await logEvent("delete", "glucose_reading", undefined, { scope: "week", startDayKey, endDayKey });
            });
            return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        console.error("Bulk delete failed:", error);
        return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
    }
}
