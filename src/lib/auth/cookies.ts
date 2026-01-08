import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "blodsukker_session";

export async function setAuthCookie(sessionToken: string) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

export async function getAuthCookie() {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function deleteAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
}
