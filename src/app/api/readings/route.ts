import { NextRequest, NextResponse } from "next/server";
import { createReading, listReadingsByDayKeyRange } from "@/lib/domain/reading";
import { parseISO, addDays } from "date-fns";
import { computeDayKey } from "@/lib/utils/day-key";

export const dynamic = "force-dynamic";

const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const startDayKeyParam = searchParams.get("startDayKey");
        const endDayKeyParam = searchParams.get("endDayKey");

        // Primary Fetch Mode: Explicit Range (New)
        if (startDayKeyParam && endDayKeyParam) {
            if (!DAY_KEY_REGEX.test(startDayKeyParam) || !DAY_KEY_REGEX.test(endDayKeyParam)) {
                return NextResponse.json({ error: "Invalid dayKey format" }, { status: 400 });
            }
            if (startDayKeyParam > endDayKeyParam) {
                return NextResponse.json({ error: "startDayKey must be <= endDayKey" }, { status: 400 });
            }

            const readings = await listReadingsByDayKeyRange(startDayKeyParam, endDayKeyParam);
            return NextResponse.json(readings, {
                headers: { "Cache-Control": "private, no-store" },
            });
        }

        // Secondary Mode: Week Fetch (Legacy/WeekLog)
        let weekStartDayKey = searchParams.get("weekStartDayKey");
        const dateStr = searchParams.get("date");

        // Validate weekStartDayKey format if provided
        if (weekStartDayKey && !DAY_KEY_REGEX.test(weekStartDayKey)) {
            return NextResponse.json(
                { error: "Invalid weekStartDayKey format. Expected YYYY-MM-DD" },
                { status: 400 }
            );
        }

        // Legacy Fallback: derive from date or defaults
        if (!weekStartDayKey) {
            let date: Date;
            if (dateStr) {
                date = parseISO(dateStr);
                if (isNaN(date.getTime())) {
                    return NextResponse.json(
                        { error: "Invalid date format" },
                        { status: 400 }
                    );
                }
            } else {
                date = new Date(); // Default to today if nothing provided
            }

            // Convert to Oslo local date and compute the Monday of that week
            const localDayKey = computeDayKey(date);
            const localDate = new Date(localDayKey + "T12:00:00Z"); // Noon to avoid DST issues
            const dayOfWeek = localDate.getUTCDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 0=Sunday
            const monday = addDays(localDate, mondayOffset);
            weekStartDayKey = monday.toISOString().split("T")[0];
        }

        // Compute end of week (Sunday = Monday + 6 days)
        const startDate = new Date(weekStartDayKey + "T12:00:00Z");
        const endDate = addDays(startDate, 6);
        const weekEndDayKey = endDate.toISOString().split("T")[0];

        const readings = await listReadingsByDayKeyRange(weekStartDayKey, weekEndDayKey);

        return NextResponse.json(readings, {
            headers: {
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Failed to fetch readings:", error);
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
