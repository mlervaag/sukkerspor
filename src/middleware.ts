import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "@/lib/auth/middleware";

const EXEMPT_PATHS = ["/login", "/api/auth/login", "/api/health", "/favicon.ico"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Static files and public health
    if (
        pathname.startsWith("/_next") ||
        EXEMPT_PATHS.some((path) => pathname === path)
    ) {
        return NextResponse.next();
    }

    const session = req.cookies.get("blodsukker_session")?.value;
    const authenticated = isValidSession(session);

    if (!authenticated) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Already authenticated, trying to access login
    if (authenticated && pathname === "/login") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
