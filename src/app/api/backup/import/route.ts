import { NextRequest, NextResponse } from "next/server";
import { validateBackup } from "@/lib/backup/validate";
import { importBackup } from "@/lib/backup/import";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Required for transaction support

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backupData = validateBackup(body);

        await importBackup(backupData);

        return NextResponse.json({
            success: true,
            count: backupData.readings.length,
            insulinDoseCount: backupData.insulin_doses?.length || 0,
        }, {
            headers: {
                "Cache-Control": "no-store",
            }
        });
    } catch (error: any) {
        console.error("Import failed:", error);
        return NextResponse.json(
            { error: error.message || "Import failed" },
            { status: 400 }
        );
    }
}
