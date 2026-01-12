import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Korumalı rotalar
    const isProtectedRoute =
        pathname.startsWith("/books") ||
        pathname.startsWith("/movies") ||
        pathname.startsWith("/series") ||
        pathname.startsWith("/wishlist") ||
        pathname.startsWith("/profile");

    // Auth rotaları
    const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register");

    // Session token kontrolü (cookie'den)
    const authToken = request.cookies.get("authjs.session-token") ||
        request.cookies.get("__Secure-authjs.session-token");
    const isLoggedIn = !!authToken;

    // Giriş yapmış kullanıcı auth sayfalarına gitmeye çalışırsa
    if (isLoggedIn && isAuthRoute) {
        return NextResponse.redirect(new URL("/books", request.url));
    }

    // Giriş yapmamış kullanıcı korumalı sayfaya gitmeye çalışırsa
    if (!isLoggedIn && isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
