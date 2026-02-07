import { NextResponse } from "next/server";
import { exportBackup } from "@/lib/backup/export";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const backup = await exportBackup();
        const filename = `sukkerspor_backup_${new Date().toISOString().split("T")[0]}.json`;

        return new NextResponse(JSON.stringify(backup, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Export failed:", error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
