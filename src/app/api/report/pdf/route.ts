import { NextRequest, NextResponse } from "next/server";
import { getReportData, ReportRange } from "@/lib/report/report-data";
import { generatePDF } from "@/lib/report/generate-pdf";
import { Language } from "@/lib/report/translations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const range = (searchParams.get("range") || "week") as ReportRange;
        const langString = searchParams.get("lang") || "no";
        const lang = (["no", "en"].includes(langString) ? langString : "no") as Language;

        if (!["week", "month", "all"].includes(range)) {
            return NextResponse.json({ error: "Invalid range" }, { status: 400 });
        }

        const data = await getReportData(range);
        const pdfBytes = await generatePDF(data, lang);

        const filename = `blodsukker_rapport_${range}_${formatDate(new Date())}.pdf`;

        return new NextResponse(pdfBytes as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("PDF Generation failed:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}

function formatDate(date: Date) {
    return date.toISOString().split("T")[0];
}
