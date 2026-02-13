import { resolveMx, resolve4 } from "node:dns/promises";

const DISPOSABLE_DOMAINS = [
    "tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com",
    "yopmail.com", "temp-mail.org", "dispostable.com", "getnada.com",
    "sharklasers.com", "fakeinbox.com", "burnermail.io", "trashmail.com",
    "temp-mail.io", "moakt.com", "tempmailaddress.com", "tempmail.net"
];

const POPULAR_DOMAINS = [
    "gmail.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.com",
    "yandex.com", "protonmail.com", "proton.me", "me.com", "live.com"
];

function getLevenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
        Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

export async function validateEmailDomain(email: string): Promise<{ valid: boolean; reason?: string; suggestion?: string }> {
    const parts = email.split("@");
    const domain = parts[1]?.toLowerCase();

    if (!domain) {
        return { valid: false, reason: "Geçersiz e-posta formatı" };
    }

    // 1. Yazım hatası kontrolü
    if (!POPULAR_DOMAINS.includes(domain)) {
        for (const popular of POPULAR_DOMAINS) {
            const distance = getLevenshteinDistance(domain, popular);
            if (distance > 0 && distance <= 2) {
                return { valid: true, suggestion: `${parts[0]}@${popular}` };
            }
        }
    }

    // 2. Geçici mail kontrolü
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return { valid: false, reason: "Geçici e-posta adresleri güvenlik nedeniyle kabul edilmemektedir" };
    }

    try {
        // 3. DNS Kontrolleri
        const mxRecords = await resolveMx(domain).catch(() => []);
        if (mxRecords.length > 0) return { valid: true };

        const aRecords = await resolve4(domain).catch(() => []);
        if (aRecords.length > 0) return { valid: true };

        return { valid: false, reason: "Bu e-posta sunucusu mevcut değil görünüyor" };
    } catch (error) {
        return { valid: true }; // DNS hatası durumunda kullanıcıyı engelleme
    }
}
