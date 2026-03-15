import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
    const { pathname } = request.nextUrl;
    const isLoggedIn = !!request.auth;

    const isProtectedRoute =
        pathname.startsWith("/books") ||
        pathname.startsWith("/movies") ||
        pathname.startsWith("/series") ||
        pathname.startsWith("/wishlist") ||
        pathname.startsWith("/profile");

    const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register");

    if (isLoggedIn && isAuthRoute) {
        return NextResponse.redirect(new URL("/books", request.url));
    }

    if (!isLoggedIn && isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Her istek icin benzersiz nonce uret
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    const cspHeader = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data: https: http:",
        "font-src 'self'",
        "connect-src 'self' https://www.googleapis.com https://api.penguinrandomhouse.com https://openlibrary.org https://api.themoviedb.org https://api.jikan.moe https://wsrv.nl https://*.vercel.app",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; ');

    // Nonce'u server component'lerin okuyabilmesi icin request header'a ekle
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });

    response.headers.set('Content-Security-Policy', cspHeader);

    return response;
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
