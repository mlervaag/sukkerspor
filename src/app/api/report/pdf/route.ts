import { NextRequest, NextResponse } from "next/server";
import { getReportData, ReportRange } from "@/lib/report/report-data";
import { generatePDF, ReportOptions } from "@/lib/report/generate-pdf";
import { Language } from "@/lib/report/translations";
import { getSettings } from "@/lib/domain/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const range = (searchParams.get("range") || "week") as ReportRange;

        // Get language from query or fetch from settings
        let langString = searchParams.get("lang");
        if (!langString) {
            const settings = await getSettings();
            langString = settings.reportLanguage;
        }

        const lang = (["no", "en"].includes(langString || "") ? langString : "no") as Language;

        if (!["week", "month", "all"].includes(range)) {
            return NextResponse.json({ error: "Invalid range" }, { status: 400 });
        }

        // Report content options (all default to true if not specified)
        const options: ReportOptions = {
            includeReadings: searchParams.get("readings") !== "0",
            includeMealInfo: searchParams.get("meals") !== "0",
            includeNotes: searchParams.get("notes") !== "0",
            includeInsulin: searchParams.get("insulin") !== "0",
            includeExtendedStats: searchParams.get("extStats") !== "0",
        };

        const data = await getReportData(range);
        const pdfBytes = await generatePDF(data, lang, options);

        const filename = `blodsukker_rapport_${range}.pdf`;

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
