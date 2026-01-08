/**
 * Edge-compatible HMAC utilities using Web Crypto API
 * This file MUST NOT import from 'crypto' (Node.js module)
 */

const encoder = new TextEncoder();

/**
 * Generate HMAC-SHA256 signature and return as hex string
 */
export async function hmacSign(secret: string, data: string): Promise<string> {
    const key = await globalThis.crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await globalThis.crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(data)
    );

    return bufferToHex(new Uint8Array(signature));
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Convert Uint8Array to hex string
 */
function bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
