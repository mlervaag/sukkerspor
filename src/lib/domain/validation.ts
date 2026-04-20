/**
 * Server-side validation for domain inputs.
 * Throws ValidationError with a user-facing message on failure.
 */

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

const MEAL_TYPES = ["Frokost", "Lunsj", "Middag", "Kveldsmat", "Mellommåltid"] as const;
const INSULIN_TYPES = ["long_acting", "rapid_acting"] as const;
const MEAL_CONTEXTS = ["Frokost", "Lunsj", "Middag", "Kveldsmat"] as const;

const MAX_TEXT_LENGTH = 2000;

function assertText(value: unknown, field: string): string | null | undefined {
    if (value === undefined || value === null || value === "") return value as string | null | undefined;
    if (typeof value !== "string") {
        throw new ValidationError(`Ugyldig ${field}`);
    }
    if (value.length > MAX_TEXT_LENGTH) {
        throw new ValidationError(`${field} er for lang (maks ${MAX_TEXT_LENGTH} tegn)`);
    }
    return value;
}

function assertEnum<T extends readonly string[]>(
    value: unknown,
    allowed: T,
    field: string,
): T[number] | null | undefined {
    if (value === undefined || value === null || value === "") return value as null | undefined;
    if (typeof value !== "string" || !allowed.includes(value as T[number])) {
        throw new ValidationError(`Ugyldig verdi for ${field}`);
    }
    return value as T[number];
}

function assertDate(value: unknown, field: string): Date {
    if (value === undefined || value === null) {
        throw new ValidationError(`${field} mangler`);
    }
    const date = value instanceof Date ? value : new Date(value as string);
    if (isNaN(date.getTime())) {
        throw new ValidationError(`Ugyldig tidspunkt for ${field}`);
    }
    return date;
}

function assertNumber(value: unknown, field: string): number {
    const num = typeof value === "string" ? parseFloat(value.replace(",", ".")) : Number(value);
    if (!Number.isFinite(num)) {
        throw new ValidationError(`Ugyldig tallverdi for ${field}`);
    }
    return num;
}

export interface ValidatedReadingInput {
    valueMmolL: string;
    measuredAt: Date;
    isFasting: boolean;
    isPostMeal: boolean;
    mealType: string | null;
    partOfDay: string | null;
    foodText: string | null;
    feelingNotes: string | null;
}

export function validateReadingInput(raw: unknown): ValidatedReadingInput {
    if (!raw || typeof raw !== "object") {
        throw new ValidationError("Ugyldig data");
    }
    const input = raw as Record<string, unknown>;

    const value = assertNumber(input.valueMmolL, "blodsukkerverdi");
    if (value <= 0 || value > 25) {
        throw new ValidationError("Blodsukkerverdi må være mellom 0,1 og 25 mmol/L");
    }

    const measuredAt = assertDate(input.measuredAt, "tidspunkt");
    const isFasting = Boolean(input.isFasting);
    const isPostMeal = Boolean(input.isPostMeal);

    if (isFasting && isPostMeal) {
        throw new ValidationError("Måling kan ikke være både fastende og etter måltid");
    }

    const mealType = assertEnum(input.mealType, MEAL_TYPES, "måltidstype") ?? null;
    const partOfDay = (assertText(input.partOfDay, "tidspunkt på dagen") ?? null) as string | null;
    const foodText = (assertText(input.foodText, "matbeskrivelse") ?? null) as string | null;
    const feelingNotes = (assertText(input.feelingNotes, "notater") ?? null) as string | null;

    return {
        valueMmolL: value.toFixed(1),
        measuredAt,
        isFasting,
        isPostMeal,
        mealType,
        partOfDay,
        foodText,
        feelingNotes,
    };
}

export function validatePartialReadingInput(raw: unknown): Partial<ValidatedReadingInput> {
    if (!raw || typeof raw !== "object") {
        throw new ValidationError("Ugyldig data");
    }
    const input = raw as Record<string, unknown>;
    const out: Partial<ValidatedReadingInput> = {};

    if ("valueMmolL" in input) {
        const v = assertNumber(input.valueMmolL, "blodsukkerverdi");
        if (v <= 0 || v > 25) throw new ValidationError("Blodsukkerverdi må være mellom 0,1 og 25 mmol/L");
        out.valueMmolL = v.toFixed(1);
    }
    if ("measuredAt" in input) out.measuredAt = assertDate(input.measuredAt, "tidspunkt");
    if ("isFasting" in input) out.isFasting = Boolean(input.isFasting);
    if ("isPostMeal" in input) out.isPostMeal = Boolean(input.isPostMeal);
    if (out.isFasting && out.isPostMeal) {
        throw new ValidationError("Måling kan ikke være både fastende og etter måltid");
    }
    if ("mealType" in input) out.mealType = (assertEnum(input.mealType, MEAL_TYPES, "måltidstype") ?? null) as string | null;
    if ("partOfDay" in input) out.partOfDay = (assertText(input.partOfDay, "tidspunkt på dagen") ?? null) as string | null;
    if ("foodText" in input) out.foodText = (assertText(input.foodText, "matbeskrivelse") ?? null) as string | null;
    if ("feelingNotes" in input) out.feelingNotes = (assertText(input.feelingNotes, "notater") ?? null) as string | null;
    return out;
}

export interface ValidatedInsulinDoseInput {
    doseUnits: string;
    administeredAt: Date;
    insulinType: "long_acting" | "rapid_acting";
    insulinName: string | null;
    mealContext: string | null;
    notes: string | null;
}

export function validateInsulinDoseInput(raw: unknown): ValidatedInsulinDoseInput {
    if (!raw || typeof raw !== "object") {
        throw new ValidationError("Ugyldig data");
    }
    const input = raw as Record<string, unknown>;

    const dose = assertNumber(input.doseUnits, "dose");
    if (dose <= 0 || dose > 200) {
        throw new ValidationError("Dose må være mellom 0,1 og 200 enheter");
    }

    const administeredAt = assertDate(input.administeredAt, "tidspunkt");
    const insulinType = assertEnum(input.insulinType, INSULIN_TYPES, "insulintype");
    if (!insulinType) {
        throw new ValidationError("Insulintype mangler");
    }

    const insulinName = (assertText(input.insulinName, "insulinnavn") ?? null) as string | null;
    const mealContext = (assertEnum(input.mealContext, MEAL_CONTEXTS, "måltid") ?? null) as string | null;
    const notes = (assertText(input.notes, "notater") ?? null) as string | null;

    return {
        doseUnits: dose.toFixed(1),
        administeredAt,
        insulinType,
        insulinName,
        mealContext,
        notes,
    };
}

export function validatePartialInsulinDoseInput(raw: unknown): Partial<ValidatedInsulinDoseInput> {
    if (!raw || typeof raw !== "object") {
        throw new ValidationError("Ugyldig data");
    }
    const input = raw as Record<string, unknown>;
    const out: Partial<ValidatedInsulinDoseInput> = {};

    if ("doseUnits" in input) {
        const d = assertNumber(input.doseUnits, "dose");
        if (d <= 0 || d > 200) throw new ValidationError("Dose må være mellom 0,1 og 200 enheter");
        out.doseUnits = d.toFixed(1);
    }
    if ("administeredAt" in input) out.administeredAt = assertDate(input.administeredAt, "tidspunkt");
    if ("insulinType" in input) {
        const t = assertEnum(input.insulinType, INSULIN_TYPES, "insulintype");
        if (t) out.insulinType = t;
    }
    if ("insulinName" in input) out.insulinName = (assertText(input.insulinName, "insulinnavn") ?? null) as string | null;
    if ("mealContext" in input) out.mealContext = (assertEnum(input.mealContext, MEAL_CONTEXTS, "måltid") ?? null) as string | null;
    if ("notes" in input) out.notes = (assertText(input.notes, "notater") ?? null) as string | null;
    return out;
}
