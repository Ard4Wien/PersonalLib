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

    // 1. Yazım hatası kontrolü (Yerel)
    if (!POPULAR_DOMAINS.includes(domain)) {
        for (const popular of POPULAR_DOMAINS) {
            const distance = getLevenshteinDistance(domain, popular);
            if (distance > 0 && distance <= 2) {
                return { valid: true, suggestion: `${parts[0]}@${popular}` };
            }
        }
    }

    // 2. Geçici mail kontrolü (Yerel)
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return { valid: false, reason: "Geçici e-posta adresleri güvenlik nedeniyle kabul edilmemektedir" };
    }

    // 3. Çoklu API Key ile Abstract API Kontrolü
    const apiKeys = (process.env.ABSTRACT_EMAIL_VERIFY_KEYS || "").split(",").filter(Boolean);

    if (apiKeys.length > 0) {
        for (const key of apiKeys) {
            try {
                const response = await fetch(
                    `https://emailreputation.abstractapi.com/v1/?api_key=${key.trim()}&email=${encodeURIComponent(email)}`
                );

                if (response.status === 429 || response.status === 422) {
                    continue; // Kota dolmuş veya geçersiz anahtar, bir sonrakini dene
                }

                if (response.ok) {
                    const data = await response.json();

                    // SMTP geçerli değilse veya teslim edilebilir değilse engelle
                    if (data.email_deliverability) {
                        const isDeliverable = data.email_deliverability.status === "deliverable";
                        const isSmtpValid = data.email_deliverability.is_smtp_valid;

                        if (!isDeliverable || !isSmtpValid) {
                            return {
                                valid: false,
                                reason: "Bu e-posta adresi ulaşılamaz görünüyor. Lütfen geçerli bir adres giriniz."
                            };
                        }

                        return { valid: true };
                    }
                }
            } catch (error) {
                console.error("Abstract API error:", error);
                continue; // Hata durumunda diğer anahtarı dene
            }
        }
    }

    // 4. Fallback: API'ler biterse veya hata alırsa DNS Kontrolü
    try {
        const mxRecords = await resolveMx(domain).catch(() => []);
        if (mxRecords.length > 0) return { valid: true };

        const aRecords = await resolve4(domain).catch(() => []);
        if (aRecords.length > 0) return { valid: true };

        return { valid: false, reason: "Bu e-posta sunucusu mevcut değil görünüyor" };
    } catch (error) {
        return { valid: true };
    }
}
