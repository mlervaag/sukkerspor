import { db } from "@/lib/db";
import { eventLog } from "@/lib/db/schema";

export type EventType = "create" | "update" | "delete" | "import" | "export" | "report" | "settings_change";
export type EntityType = "glucose_reading" | "insulin_dose" | "settings" | "backup";

export async function logEvent(
    eventType: EventType,
    entityType: EntityType,
    entityId?: string,
    payload?: unknown
) {
    try {
        await db.insert(eventLog).values({
            eventType,
            entityType,
            entityId,
            payload: payload !== undefined ? JSON.stringify(payload) : null,
        });
    } catch (error) {
        // Event logging is best-effort; never block the main flow.
        console.error("Failed to log event:", error);
    }
}
