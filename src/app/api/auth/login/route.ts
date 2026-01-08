import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth/cookies";
import { getExpectedHash } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();
        const expectedPassword = process.env.APP_PASSWORD || "devpassword";

        if (password === expectedPassword) {
            const token = getExpectedHash();
            await setAuthCookie(token);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}
