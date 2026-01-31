import { resolveMx, resolve4 } from "node:dns/promises";

/**
 * Checks if an email domain has valid DNS records (MX or A).
 * This helps filter out completely fake domains like "test@asdfghjkl123.com".
 */
export async function validateEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
    const domain = email.split("@")[1];

    if (!domain) {
        return { valid: false, reason: "Geçersiz e-posta formatı" };
    }

    try {
        // 1. Önce MX kayıtlarını kontrol et (E-posta sunucusu var mı?)
        const mxRecords = await resolveMx(domain).catch(() => []);
        if (mxRecords.length > 0) {
            return { valid: true };
        }

        // 2. MX yoksa A kaydı kontrol et (Domain bir sunucuya bağlı mı?)
        // Bazı küçük mail servisleri sadece A kaydı kullanabilir.
        const aRecords = await resolve4(domain).catch(() => []);
        if (aRecords.length > 0) {
            return { valid: true };
        }

        return { valid: false, reason: "Bu e-posta domaini (sunucusu) mevcut değil" };
    } catch (error) {
        console.error("DNS verification error:", error);
        // DNS hatası durumunda (örneğin servis kapalıysa) kullanıcıyı engellememek için true dönüyoruz.
        return { valid: true };
    }
}
