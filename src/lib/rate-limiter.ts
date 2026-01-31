/**
 * In-Memory Rate Limiter for Authentication Endpoints
 * 
 * Bu modül, kimlik doğrulama endpoint'lerini brute force saldırılarına
 * karşı korumak için rate limiting ve account lockout mekanizması sağlar.
 */

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
    lockedUntil?: number;
}

// In-memory storage (production'da Redis kullanılmalı)
const rateLimitStore = new Map<string, RateLimitEntry>();
const failedLoginStore = new Map<string, RateLimitEntry>();

// Konfigürasyon
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 dakika
const MAX_REQUESTS_PER_WINDOW = 10; // Dakikada max 10 istek
const MAX_FAILED_LOGINS = 5; // 5 başarısız deneme
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 dakika

/**
 * IP bazlı rate limiting kontrolü
 * @param ip - İstek yapan IP adresi
 * @returns { success: boolean, message?: string, retryAfter?: number }
 */
export function checkRateLimit(ip: string): {
    success: boolean;
    message?: string;
    retryAfter?: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    // Yeni IP
    if (!entry) {
        rateLimitStore.set(ip, { count: 1, firstAttempt: now });
        return { success: true };
    }

    // Window süresi dolmuş, sıfırla
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { count: 1, firstAttempt: now });
        return { success: true };
    }

    // Limit aşılmış mı?
    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
        const retryAfter = Math.ceil((entry.firstAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000);
        return {
            success: false,
            message: "Çok fazla istek. Lütfen biraz bekleyin.",
            retryAfter
        };
    }

    // Counter'ı artır
    entry.count++;
    return { success: true };
}

/**
 * Başarısız giriş denemesi kaydı ve account lockout kontrolü
 * @param email - Giriş denenilen e-posta
 * @returns { locked: boolean, message?: string, retryAfter?: number }
 */
export function checkLoginAttempt(email: string): {
    locked: boolean;
    message?: string;
    retryAfter?: number;
} {
    const now = Date.now();
    const entry = failedLoginStore.get(email);

    // Mevcut kilit kontrolü
    if (entry?.lockedUntil && entry.lockedUntil > now) {
        const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
        return {
            locked: true,
            message: `Hesap geçici olarak kilitlendi. ${Math.ceil(retryAfter / 60)} dakika sonra tekrar deneyin.`,
            retryAfter
        };
    }

    return { locked: false };
}

/**
 * Başarısız giriş denemesini kaydet
 * @param email - Giriş denenilen e-posta
 */
export function recordFailedLogin(email: string): void {
    const now = Date.now();
    const entry = failedLoginStore.get(email);

    if (!entry || now - entry.firstAttempt > LOCKOUT_DURATION_MS) {
        // Yeni kayıt veya süre dolmuş
        failedLoginStore.set(email, { count: 1, firstAttempt: now });
        return;
    }

    entry.count++;

    // Limit aşıldı, kilitle
    if (entry.count >= MAX_FAILED_LOGINS) {
        entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    }
}

/**
 * Başarılı girişte sayacı sıfırla
 * @param email - Giriş yapılan e-posta
 */
export function resetLoginAttempts(email: string): void {
    failedLoginStore.delete(email);
}

/**
 * IP adresini request'ten çıkar
 * @param request - Next.js Request objesi
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return "unknown";
}
