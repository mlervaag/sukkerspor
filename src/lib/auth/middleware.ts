import { NextRequest } from "next/server";
import crypto from "crypto";

export function getExpectedHash() {
    const password = process.env.APP_PASSWORD;
    const secret = process.env.APP_COOKIE_SECRET;
    if (!password || !secret) {
        throw new Error("Missing required auth environment variables");
    }
    return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

export function isValidSession(sessionValue: string | undefined) {
    if (!sessionValue) return false;
    const expected = getExpectedHash();
    try {
        return crypto.timingSafeEqual(
            Buffer.from(sessionValue),
            Buffer.from(expected)
        );
    } catch {
        return false;
    }
}
