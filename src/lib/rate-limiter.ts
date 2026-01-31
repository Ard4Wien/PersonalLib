

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
    lockedUntil?: number;
}


const rateLimitStore = new Map<string, RateLimitEntry>();
const failedLoginStore = new Map<string, RateLimitEntry>();


const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;


export function checkRateLimit(ip: string): {
    success: boolean;
    message?: string;
    retryAfter?: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);


    if (!entry) {
        rateLimitStore.set(ip, { count: 1, firstAttempt: now });
        return { success: true };
    }


    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { count: 1, firstAttempt: now });
        return { success: true };
    }


    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
        const retryAfter = Math.ceil((entry.firstAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000);
        return {
            success: false,
            message: "Çok fazla istek. Lütfen biraz bekleyin.",
            retryAfter
        };
    }


    entry.count++;
    return { success: true };
}


export function checkLoginAttempt(email: string): {
    locked: boolean;
    message?: string;
    retryAfter?: number;
} {
    const now = Date.now();
    const entry = failedLoginStore.get(email);


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


export function recordFailedLogin(email: string): void {
    const now = Date.now();
    const entry = failedLoginStore.get(email);

    if (!entry || now - entry.firstAttempt > LOCKOUT_DURATION_MS) {

        failedLoginStore.set(email, { count: 1, firstAttempt: now });
        return;
    }

    entry.count++;


    if (entry.count >= MAX_FAILED_LOGINS) {
        entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    }
}


export function resetLoginAttempts(email: string): void {
    failedLoginStore.delete(email);
}


export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return "unknown";
}
