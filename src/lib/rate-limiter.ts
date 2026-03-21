import prisma from "./prisma";


const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 dakika
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 dakika


export async function checkRateLimit(ip: string): Promise<{
    success: boolean;
    message?: string;
    retryAfter?: number;
}> {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    const recentAttempts = await prisma.loginAttempt.count({
        where: {
            ip,
            createdAt: { gte: windowStart }
        }
    });

    if (recentAttempts >= MAX_REQUESTS_PER_WINDOW) {
        const retryAfter = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
        return {
            success: false,
            message: "Çok fazla istek. Lütfen biraz bekleyin.",
            retryAfter
        };
    }

    return { success: true };
}


export async function checkLoginAttempt(email: string): Promise<{
    locked: boolean;
    message?: string;
    retryAfter?: number;
}> {
    const lockoutWindowStart = new Date(Date.now() - LOCKOUT_DURATION_MS);

    const failedAttempts = await prisma.loginAttempt.count({
        where: {
            email,
            success: false,
            createdAt: { gte: lockoutWindowStart }
        }
    });

    if (failedAttempts >= MAX_FAILED_LOGINS) {
        // Son başarısız denemenin zamanını bul
        const lastFailed = await prisma.loginAttempt.findFirst({
            where: {
                email,
                success: false,
                createdAt: { gte: lockoutWindowStart }
            },
            orderBy: { createdAt: "desc" }
        });

        if (lastFailed) {
            const lockoutEnd = new Date(lastFailed.createdAt.getTime() + LOCKOUT_DURATION_MS);
            const now = new Date();

            if (lockoutEnd > now) {
                const retryAfter = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 1000);
                return {
                    locked: true,
                    message: `Giriş bilgileri hatalı veya hesap kilitli. Lütfen bir süre sonra tekrar deneyin.`,
                    retryAfter
                };
            }
        }
    }

    return { locked: false };
}


export async function recordFailedLogin(email: string, ip: string = "unknown"): Promise<void> {
    await prisma.loginAttempt.create({
        data: { email, ip, success: false }
    });
}


export async function resetLoginAttempts(email: string): Promise<void> {
    // Başarılı giriş kaydı oluştur (isteğe bağlı audit trail)
    // Eski başarısız denemeleri temizle
    await prisma.loginAttempt.deleteMany({
        where: {
            email,
            success: false
        }
    });
}


export function getClientIP(request: Request): string {
    // Güvenilir proxy header'ları (Vercel, Cloudflare, vb.)
    // Bu header'lar platform tarafından ayarlanır ve istemci tarafından manipüle edilemez
    const trustedHeaders = [
        "x-real-ip",            // Nginx / Vercel
        "cf-connecting-ip",     // Cloudflare
        "x-vercel-forwarded-for", // Vercel
    ];

    for (const header of trustedHeaders) {
        const value = request.headers.get(header);
        if (value) {
            const ip = value.split(",")[0].trim();
            if (isValidIP(ip)) return ip;
        }
    }

    // Fallback: x-forwarded-for (manipüle edilebilir ama son çare)
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const ip = forwarded.split(",")[0].trim();
        if (isValidIP(ip)) return ip;
    }

    return "unknown";
}


// Basit IP format doğrulaması (IPv4 ve IPv6)
function isValidIP(ip: string): boolean {
    // IPv4
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return true;
    // IPv6 (basitleştirilmiş)
    if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":")) return true;
    return false;
}


// Eski kayıtları temizleme (24 saatten eski)
export async function cleanupOldAttempts(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: cutoff } }
    });
}
