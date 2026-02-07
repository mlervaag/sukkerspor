import { NextRequest, NextResponse } from "next/server";
import { updateInsulinDose } from "@/lib/domain/insulin-dose";
import { db } from "@/lib/db";
import { insulinDoses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logEvent } from "@/lib/domain/event-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    try {
        const input = await req.json();
        await updateInsulinDose(id, input);

        return NextResponse.json({ success: true }, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Failed to update insulin dose:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const dose = await db.query.insulinDoses.findFirst({
            where: eq(insulinDoses.id, id),
        });

        if (!dose) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await db.transaction(async (tx) => {
            await tx.delete(insulinDoses).where(eq(insulinDoses.id, id));
            await logEvent("delete", "insulin_dose", id, {
                administeredAt: dose.administeredAt,
                units: dose.doseUnits,
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
