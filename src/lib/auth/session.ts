/**
 * Session token generation and validation for Edge runtime
 * This file MUST NOT import from 'crypto' (Node.js module)
 */

import { hmacSign, safeCompare } from "./edge-crypto";

/**
 * Generate the expected session token from APP_PASSWORD
 * Uses HMAC-SHA256 with APP_COOKIE_SECRET as the key
 */
export async function generateSessionToken(): Promise<string> {
    const password = process.env.APP_PASSWORD;
    const secret = process.env.APP_COOKIE_SECRET;

    if (!password || !secret) {
        throw new Error("Missing required auth environment variables");
    }

    return hmacSign(secret, password);
}

/**
 * Validate a session token against the expected value
 * Uses constant-time comparison to prevent timing attacks
 */
export async function isValidSession(sessionValue: string | undefined): Promise<boolean> {
    if (!sessionValue) return false;

    try {
        const expected = await generateSessionToken();
        return safeCompare(sessionValue, expected);
    } catch {
        return false;
    }
}
