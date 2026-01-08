import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";
import { TRANSLATIONS, Language } from "./translations";
import { GlucoseReading } from "../domain/types";

export async function generatePDF(data: {
    readings: GlucoseReading[];
    stats: any;
    range: string;
    start: Date | null;
    end: Date | null;
}, lang: Language) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.no;

    const pdfDoc = await PDFDocument.create();
    // Determinism: Set fixed creation/mod dates
    pdfDoc.setCreationDate(new Date(2026, 0, 1));
    pdfDoc.setModificationDate(new Date(2026, 0, 1));

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    // Header
    page.drawText(t.title, { x: 50, y, size: 24, font: fontBold });
    y -= 30;

    const rangeText = data.start && data.end
        ? `${format(data.start, "dd.MM.yyyy")} - ${format(data.end, "dd.MM.yyyy")}`
        : t[`range_${data.range}` as keyof typeof t] || data.range;

    page.drawText(rangeText as string, { x: 50, y, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 40;

    // Summary section
    if (data.stats) {
        page.drawText(t.header_summary, { x: 50, y, size: 16, font: fontBold });
        y -= 25;

        page.drawText(`${t.total_readings}: ${data.stats.total}`, { x: 50, y, size: 12, font });
        y -= 15;

        if (data.stats.avgFasting !== null) {
            page.drawText(`${t.fasting_summary}: ${data.stats.avgFasting.toFixed(1)} mmol/L`, { x: 50, y, size: 12, font });
            y -= 15;
        }

        page.drawText(`${t.threshold_compliance}: ${data.stats.compliancePercent.toFixed(0)}%`, { x: 50, y, size: 12, font });
        y -= 40;
    }

    // Table Header
    const rowHeight = 20;
    const drawRow = (p: any, py: number, cols: string[], isHeader = false) => {
        const xOffsets = [50, 150, 200, 260, 350];
        const currentFont = isHeader ? fontBold : font;
        cols.forEach((txt, i) => {
            p.drawText(txt || "", { x: xOffsets[i], y: py, size: 10, font: currentFont });
        });
    };

    drawRow(page, y, [t.table_timestamp, t.table_value, t.table_type, t.table_meal, t.table_feeling], true);
    y -= rowHeight;
    page.drawLine({ start: { x: 50, y: y + 15 }, end: { x: width - 50, y: y + 15 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

    // Readings
    for (const r of data.readings) {
        if (y < 70) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - 50;
            drawRow(page, y, [t.table_timestamp, t.table_value, t.table_type, t.table_meal, t.table_feeling], true);
            y -= rowHeight;
        }

        const type = r.isFasting ? (lang === "no" ? "Fastende" : "Fasting") : (r.isPostMeal ? (lang === "no" ? "Etter måltid" : "Post-meal") : "");
        const meal = r.mealType ? (t.meal_types as any)[r.mealType] || r.mealType : "";
        const feeling = r.feelingNotes ? r.feelingNotes.substring(0, 30) + (r.feelingNotes.length > 30 ? "..." : "") : "";

        drawRow(page, y, [
            format(new Date(r.measuredAt), "dd.MM HH:mm"),
            `${r.valueMmolL}`,
            type,
            meal,
            feeling
        ]);
        y -= rowHeight;
    }

    // Disclaimer
    const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    lastPage.drawText(t.disclaimer, {
        x: 50,
        y: 40,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
        maxWidth: width - 100
    });

    return await pdfDoc.save();
}
