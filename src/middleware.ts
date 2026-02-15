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

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
