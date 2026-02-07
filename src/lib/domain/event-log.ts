import { db } from "@/lib/db";
import { eventLog } from "@/lib/db/schema";

export type EventType = "create" | "update" | "delete" | "import" | "export" | "report" | "settings_change";
export type EntityType = "glucose_reading" | "insulin_dose" | "settings" | "backup";

export async function logEvent(
    eventType: EventType,
    entityType: EntityType,
    entityId?: string,
    payload?: any
) {
    try {
        await db.insert(eventLog).values({
            eventType,
            entityType,
            entityId,
            payload: payload ? JSON.stringify(payload) : null,
        });
    } catch (error) {
        console.error("Failed to log event:", error);
        // We don't want event logging failures to block the main flow
    }
}
