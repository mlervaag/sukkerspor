export const TRANSLATIONS = {
    no: {
        title: "Blodsukkerrapport",
        range_week: "Uke",
        range_month: "Måned",
        range_all: "Alle data",
        header_summary: "Oppsummering",
        total_readings: "Antall målinger",
        completeness: "Kompletthet",
        fasting_summary: "Fastende verdier (gjennomsnitt)",
        post_meal_summary: "Etter måltid (gjennomsnitt)",
        threshold_compliance: "Overholdelse av grenseverdier",
        table_timestamp: "Tidspunkt",
        table_value: "Verdi",
        table_type: "Type",
        table_meal: "Måltid",
        table_feeling: "Notater",
        disclaimer: "Denne rapporten er kun til informasjonsformål. Ta kontakt med helsepersonell før du gjør endringer i din behandling.",
        meal_types: {
            Frokost: "Frokost",
            Lunsj: "Lunsj",
            Middag: "Middag",
            Kvelds: "Kvelds",
            Mellommåltid: "Mellommåltid",
        }
    },
    en: {
        title: "Blood Glucose Report",
        range_week: "Week",
        range_month: "Month",
        range_all: "All Data",
        header_summary: "Summary",
        total_readings: "Total Readings",
        completeness: "Completeness",
        fasting_summary: "Fasting Values (Average)",
        post_meal_summary: "Post-Meal (Average)",
        threshold_compliance: "Threshold Compliance",
        table_timestamp: "Timestamp",
        table_value: "Value",
        table_type: "Type",
        table_meal: "Meal",
        table_feeling: "Notes",
        disclaimer: "This report is for informational purposes only. Consult with a healthcare professional before making any changes to your treatment.",
        meal_types: {
            Frokost: "Breakfast",
            Lunsj: "Lunch",
            Middag: "Dinner",
            Kvelds: "Evening",
            Mellommåltid: "Snack",
        }
    }
};

export type Language = keyof typeof TRANSLATIONS;
