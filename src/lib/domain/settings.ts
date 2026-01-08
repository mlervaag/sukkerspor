import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { UserSettings, UserSettingsInput } from "./types";
import { logEvent } from "./event-log";

const SINGLETON_ID = "singleton";

export async function getSettings(): Promise<UserSettings> {
    const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.id, SINGLETON_ID),
    });

    if (!settings) {
        // Initialize with defaults if not exists
        const [newSettings] = await db.insert(userSettings).values({
            id: SINGLETON_ID,
            reportLanguage: "no",
        }).returning();
        return newSettings;
    }

    return settings;
}

export async function updateSettings(input: UserSettingsInput): Promise<UserSettings> {
    const [settings] = await db
        .update(userSettings)
        .set({
            ...input,
            updatedAt: new Date(),
        })
        .where(eq(userSettings.id, SINGLETON_ID))
        .returning();

    await logEvent("settings_change", "settings", undefined, { fields: Object.keys(input) });

    return settings;
}
