import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { format } from "date-fns";
import { TRANSLATIONS, Language } from "./translations";
import { GlucoseReading, InsulinDose } from "../domain/types";
import { ReportStats } from "./report-data";
import { THRESHOLDS } from "../domain/analytics";

export interface ReportOptions {
    includeReadings: boolean;
    includeMealInfo: boolean;
    includeNotes: boolean;
    includeInsulin: boolean;
    includeExtendedStats: boolean;
}

// Colours
const COLOR_RED = rgb(0.8, 0.15, 0.15);       // fasting over target
const COLOR_AMBER = rgb(0.85, 0.55, 0.0);      // post-meal over target
const COLOR_GREEN = rgb(0.1, 0.6, 0.2);
const COLOR_GRAY = rgb(0.4, 0.4, 0.4);
const COLOR_LIGHT_GRAY = rgb(0.8, 0.8, 0.8);
const COLOR_BG_RED = rgb(1, 0.93, 0.93);
const COLOR_BG_AMBER = rgb(1, 0.97, 0.88);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const ROW_H = 18;

export async function generatePDF(
    data: {
        readings: GlucoseReading[];
        insulinDoses?: InsulinDose[];
        stats: ReportStats | null;
        range: string;
        start: Date | null;
        end: Date | null;
    },
    lang: Language,
    options: ReportOptions = {
        includeReadings: true,
        includeMealInfo: true,
        includeNotes: true,
        includeInsulin: true,
        includeExtendedStats: true,
    },
) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.no;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setCreationDate(new Date(2026, 0, 1));
    pdfDoc.setModificationDate(new Date(2026, 0, 1));

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    // Helper: new page when needed
    const ensureSpace = (needed: number) => {
        if (y < needed) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            y = height - 50;
        }
    };

    // Helper: draw a stat line
    const drawStat = (label: string, value: string, color = rgb(0, 0, 0)) => {
        page.drawText(`${label}: `, { x: 50, y, size: 10, font: fontBold });
        const labelWidth = fontBold.widthOfTextAtSize(`${label}: `, 10);
        page.drawText(value, { x: 50 + labelWidth, y, size: 10, font, color });
        y -= 15;
    };

    // ── Header ──
    page.drawText(t.title, { x: 50, y, size: 22, font: fontBold });
    y -= 25;

    const rangeText = data.start && data.end
        ? `${format(data.start, "dd.MM.yyyy")} – ${format(data.end, "dd.MM.yyyy")}`
        : (t as any)[`range_${data.range}`] || data.range;

    page.drawText(rangeText as string, { x: 50, y, size: 11, font, color: COLOR_GRAY });
    y -= 10;

    // Reference thresholds line
    page.drawText(
        `${t.threshold_fasting}: \u2264${THRESHOLDS.FASTING} mmol/L    ${t.threshold_post_meal}: \u2264${THRESHOLDS.POST_MEAL} mmol/L`,
        { x: 50, y, size: 9, font, color: COLOR_GRAY }
    );
    y -= 30;

    // ── Summary Section ──
    if (data.stats) {
        page.drawText(t.header_summary, { x: 50, y, size: 14, font: fontBold });
        y -= 20;

        drawStat(t.total_readings, `${data.stats.total}`);

        if (data.stats.avgFasting !== null) {
            const avgF = data.stats.avgFasting;
            const color = avgF > THRESHOLDS.FASTING ? COLOR_RED : COLOR_GREEN;
            drawStat(t.fasting_summary, `${avgF.toFixed(1)} mmol/L`, color);
        }
        if (data.stats.avgPostMeal !== null) {
            const avgP = data.stats.avgPostMeal;
            const color = avgP > THRESHOLDS.POST_MEAL ? COLOR_AMBER : COLOR_GREEN;
            drawStat(t.post_meal_summary, `${avgP.toFixed(1)} mmol/L`, color);
        }
        drawStat(t.threshold_compliance, `${data.stats.compliancePercent.toFixed(0)}%`);

        y -= 10;

        // ── Extended Statistics ──
        if (options.includeExtendedStats && data.stats.extended) {
            const ext = data.stats.extended;

            page.drawText(t.header_extended_stats, { x: 50, y, size: 14, font: fontBold });
            y -= 20;

            const col1x = 50;
            const col2x = 300;

            // Draw column content at absolute y positions, return how far down it went
            const drawWindowColumn = (
                startX: number,
                startY: number,
                fasting: typeof ext.fasting7d,
                postMeal: typeof ext.postMeal7d,
            ): number => {
                let cy = startY;

                if (fasting.total > 0) {
                    const pct = ((fasting.within / fasting.total) * 100).toFixed(0);
                    page.drawText(
                        `${t.within_target_fasting}: ${fasting.within}/${fasting.total} (${pct}%)`,
                        { x: startX, y: cy, size: 9, font, color: fasting.overTarget > 0 ? COLOR_RED : COLOR_GREEN }
                    );
                    cy -= 13;
                    if (fasting.overTarget > 0) {
                        page.drawText(
                            `${t.over_target_fasting}: ${fasting.overTarget}`,
                            { x: startX, y: cy, size: 9, font, color: COLOR_RED }
                        );
                        cy -= 13;
                    }
                    if (fasting.low !== null && fasting.high !== null) {
                        page.drawText(
                            `${t.high_low_fasting}: ${fasting.low.toFixed(1)} – ${fasting.high.toFixed(1)}`,
                            { x: startX, y: cy, size: 9, font }
                        );
                        cy -= 13;
                    }
                }

                if (postMeal.total > 0) {
                    const pct = ((postMeal.within / postMeal.total) * 100).toFixed(0);
                    page.drawText(
                        `${t.within_target_post_meal}: ${postMeal.within}/${postMeal.total} (${pct}%)`,
                        { x: startX, y: cy, size: 9, font, color: postMeal.overTarget > 0 ? COLOR_AMBER : COLOR_GREEN }
                    );
                    cy -= 13;
                    if (postMeal.overTarget > 0) {
                        page.drawText(
                            `${t.over_target_post_meal}: ${postMeal.overTarget}`,
                            { x: startX, y: cy, size: 9, font, color: COLOR_AMBER }
                        );
                        cy -= 13;
                    }
                    if (postMeal.low !== null && postMeal.high !== null) {
                        page.drawText(
                            `${t.high_low_post_meal}: ${postMeal.low.toFixed(1)} – ${postMeal.high.toFixed(1)}`,
                            { x: startX, y: cy, size: 9, font }
                        );
                        cy -= 13;
                    }
                }

                return cy;
            };

            // Column headers
            page.drawText(t.last_7_days, { x: col1x, y, size: 11, font: fontBold });
            page.drawText(t.last_14_days, { x: col2x, y, size: 11, font: fontBold });
            const contentY = y - 16;

            // Draw both columns from the same start y
            const endY1 = drawWindowColumn(col1x, contentY, ext.fasting7d, ext.postMeal7d);
            const endY2 = drawWindowColumn(col2x, contentY, ext.fasting14d, ext.postMeal14d);

            y = Math.min(endY1, endY2) - 10;
        }

        y -= 10;
    }

    // ── Readings Table ──
    if (options.includeReadings && data.readings.length > 0) {
        ensureSpace(80);

        // Build dynamic columns based on options
        const headers: string[] = [t.table_timestamp, t.table_value, t.table_type];
        if (options.includeMealInfo) headers.push(t.table_meal);
        if (options.includeNotes) headers.push(t.table_feeling);

        // Dynamic x offsets
        const xOffsets = buildXOffsets(options);

        const drawReadingHeader = () => {
            headers.forEach((txt, i) => {
                page.drawText(txt, { x: xOffsets[i], y, size: 9, font: fontBold });
            });
            y -= ROW_H;
            page.drawLine({ start: { x: 50, y: y + 14 }, end: { x: width - 50, y: y + 14 }, thickness: 1, color: COLOR_LIGHT_GRAY });
        };

        drawReadingHeader();

        for (const r of data.readings) {
            ensureSpace(70);
            if (y === height - 50) drawReadingHeader(); // after page break, re-draw header

            const val = parseFloat(r.valueMmolL);
            const isOverFasting = r.isFasting && val > THRESHOLDS.FASTING;
            const isOverPostMeal = r.isPostMeal && val > THRESHOLDS.POST_MEAL;
            const isOver = isOverFasting || isOverPostMeal;

            // Background highlight for over-target rows
            if (isOver) {
                const bgColor = isOverFasting ? COLOR_BG_RED : COLOR_BG_AMBER;
                page.drawRectangle({
                    x: 48,
                    y: y - 3,
                    width: width - 96,
                    height: ROW_H,
                    color: bgColor,
                });
            }

            const valueColor = isOverFasting ? COLOR_RED : (isOverPostMeal ? COLOR_AMBER : rgb(0, 0, 0));
            const type = r.isFasting ? t.type_fasting : (r.isPostMeal ? t.type_post_meal : "");

            // Timestamp
            page.drawText(format(new Date(r.measuredAt), "dd.MM HH:mm"), { x: xOffsets[0], y, size: 9, font });

            // Value (colored)
            const valueStr = isOver ? `${r.valueMmolL} \u25B2` : `${r.valueMmolL}`;
            page.drawText(valueStr, { x: xOffsets[1], y, size: 9, font: isOver ? fontBold : font, color: valueColor });

            // Type
            page.drawText(type, { x: xOffsets[2], y, size: 9, font });

            // Meal info (optional)
            let colIdx = 3;
            if (options.includeMealInfo) {
                const mealParts: string[] = [];
                if (r.mealType) mealParts.push((t.meal_types as any)[r.mealType] || r.mealType);
                if (r.foodText) {
                    const truncated = r.foodText.length > 25 ? r.foodText.substring(0, 25) + "..." : r.foodText;
                    mealParts.push(truncated);
                }
                page.drawText(mealParts.join(": "), { x: xOffsets[colIdx], y, size: 9, font });
                colIdx++;
            }

            // Notes (optional)
            if (options.includeNotes) {
                const notes = r.feelingNotes ? r.feelingNotes.substring(0, 30) + (r.feelingNotes.length > 30 ? "..." : "") : "";
                page.drawText(notes, { x: xOffsets[colIdx], y, size: 9, font });
            }

            y -= ROW_H;
        }
    }

    // ── Insulin Doses Section ──
    const insulinDoses = data.insulinDoses || [];
    if (options.includeInsulin && insulinDoses.length > 0) {
        ensureSpace(120);
        y -= 15;

        page.drawText(t.insulin_header, { x: 50, y, size: 14, font: fontBold });
        y -= 5;
        page.drawText(`${t.insulin_total}: ${insulinDoses.length}`, { x: 50, y, size: 10, font });
        y -= 20;

        const insulinHeaders = [t.insulin_table_timestamp, t.insulin_table_dose, t.insulin_table_type, t.insulin_table_name, t.insulin_table_notes];
        const insulinX = [50, 145, 200, 300, 410];

        const drawInsulinHeader = () => {
            insulinHeaders.forEach((txt, i) => {
                page.drawText(txt, { x: insulinX[i], y, size: 9, font: fontBold });
            });
            y -= ROW_H;
            page.drawLine({ start: { x: 50, y: y + 14 }, end: { x: width - 50, y: y + 14 }, thickness: 1, color: COLOR_LIGHT_GRAY });
        };

        drawInsulinHeader();

        for (const d of insulinDoses) {
            ensureSpace(70);
            if (y === height - 50) drawInsulinHeader();

            const typeLabel = d.insulinType === "long_acting" ? t.insulin_type_long : t.insulin_type_rapid;
            const nameStr = d.insulinName || "";
            const notesStr = d.notes ? d.notes.substring(0, 30) + (d.notes.length > 30 ? "..." : "") : "";

            page.drawText(format(new Date(d.administeredAt), "dd.MM HH:mm"), { x: insulinX[0], y, size: 9, font });
            page.drawText(`${d.doseUnits} E`, { x: insulinX[1], y, size: 9, font });
            page.drawText(typeLabel, { x: insulinX[2], y, size: 9, font });
            page.drawText(nameStr, { x: insulinX[3], y, size: 9, font });
            page.drawText(notesStr, { x: insulinX[4], y, size: 9, font });
            y -= ROW_H;
        }
    }

    // ── Disclaimer ──
    const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    lastPage.drawText(t.disclaimer, {
        x: 50,
        y: 30,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
        maxWidth: width - 100,
    });

    return await pdfDoc.save();
}

function buildXOffsets(options: ReportOptions): number[] {
    // timestamp, value, type are always present
    const offsets = [50, 135, 185];
    let next = 250;
    if (options.includeMealInfo) { offsets.push(next); next += 140; }
    if (options.includeNotes) { offsets.push(next); }
    return offsets;
}
