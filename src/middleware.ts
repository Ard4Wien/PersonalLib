import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // Korumalı rotalar
    const isProtectedRoute =
        nextUrl.pathname.startsWith("/books") ||
        nextUrl.pathname.startsWith("/movies") ||
        nextUrl.pathname.startsWith("/series") ||
        nextUrl.pathname.startsWith("/wishlist") ||
        nextUrl.pathname.startsWith("/profile");

    // Auth rotaları (giriş yapmış kullanıcılar erişemez)
    const isAuthRoute =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

    // Giriş yapmış kullanıcı auth sayfalarına gitmeye çalışırsa
    if (isLoggedIn && isAuthRoute) {
        return NextResponse.redirect(new URL("/books", nextUrl));
    }

    // Giriş yapmamış kullanıcı korumalı sayfaya gitmeye çalışırsa
    if (!isLoggedIn && isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
