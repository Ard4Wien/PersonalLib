import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Basit in-memory rate limit (Edge Runtime uyumlu)
// Not: Her Vercel instance'i icin ayri calisir ama temel botlari durdurur.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number) {
    const now = Date.now();
    const data = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - data.lastReset > windowMs) {
        data.count = 1;
        data.lastReset = now;
    } else {
        data.count++;
    }

    rateLimitMap.set(ip, data);
    return data.count > limit;
}

export default auth((request: NextRequest & { auth: any }) => {
    const { pathname } = request.nextUrl;
    const isLoggedIn = !!request.auth;

    // Gelişmiş İstek Kontrolü (Header Validation - Arkadaş Tavsiyesi)
    // Sadece tarayıcıdan gelen geçerli istekleri kabul et
    if (request.method !== "GET" && pathname.startsWith("/api/")) {
        const fetchSite = request.headers.get("sec-fetch-site");
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");

        // Sec-Fetch-Site kontrolü (Cross-site istekleri reddet)
        if (fetchSite && fetchSite !== "same-origin") {
            return NextResponse.json({ error: "Geçersiz istek kaynağı" }, { status: 403 });
        }

        // Origin kontrolü
        if (origin && host && !origin.includes(host)) {
            return NextResponse.json({ error: "Güvenlik kısıtlaması" }, { status: 403 });
        }
    }

    // Rate Limiting (Hassas API rotaları + Login denemeleri)
    if (pathname.startsWith("/api/register") || 
        pathname.startsWith("/api/auth/forgot-password") ||
        pathname.startsWith("/api/auth/signin") ||
        pathname.startsWith("/api/auth/callback")) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        // Hassas rotalar icin: 1 dakikada 5 istek sınırı
        if (isRateLimited(ip, 5, 60 * 1000)) {
            return NextResponse.json(
                { error: "Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin." },
                { status: 429 }
            );
        }
    }

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

    // Her istek için benzersiz nonce üret (Sıkı CSP için)
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    const cspHeader = [
        "default-src 'self'",
        // SIKI GÜVENLİK: Sadece kendi domainimiz, doğrulanmış nonce'lar ve gerekli harici servisler. 'unsafe-inline' KESİNLİKLE YOK.
        `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.recaptcha.net`,
        "style-src 'self' 'unsafe-inline'",
        // GÖRSEL GÜVENLİĞİ: Sadece güvenilir medya kaynaklarına ve kendi depolama alanımıza izin ver. 'data:' ve 'https:' kaldırıldı.
        "img-src 'self' blob: https://qyeexaciulccipypubdt.supabase.co https://*.googleusercontent.com https://books.google.com https://image.tmdb.org https://covers.openlibrary.org https://wsrv.nl https://cdn.discordapp.com https://i.scdn.co https://i.ytimg.com https://cdn.myanimelist.net https://m.media-amazon.com https://images.penguinrandomhouse.com",
        "font-src 'self'",
        // BAĞLANTI GÜVENLİĞİ: Wildcard yerine sadece kendi production domainimiz.
        "connect-src 'self' https://qyeexaciulccipypubdt.supabase.co https://challenges.cloudflare.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://www.googleapis.com https://api.penguinrandomhouse.com https://openlibrary.org https://api.themoviedb.org https://api.jikan.moe https://wsrv.nl https://personal-lib.vercel.app",
        "frame-src https://challenges.cloudflare.com https://www.google.com/recaptcha/ https://recaptcha.google.com/ https://www.recaptcha.net",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
    ].join('; ');

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });

    response.headers.set('Content-Security-Policy', cspHeader);

    return response;
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"], // api rotalarini da kapsasin
};
