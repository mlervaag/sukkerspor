import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Perform SELECT 1 to verify connectivity
        await db.execute(sql`SELECT 1`);

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
        }, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json(
            { status: "unhealthy", error: "Database connection failed" },
            { status: 500 }
        );
    }
}
