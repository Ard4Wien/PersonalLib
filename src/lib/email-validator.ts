import { resolveMx, resolve4 } from "node:dns/promises";


export async function validateEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
    const domain = email.split("@")[1];

    if (!domain) {
        return { valid: false, reason: "Geçersiz e-posta formatı" };
    }

    try {

        const mxRecords = await resolveMx(domain).catch(() => []);
        if (mxRecords.length > 0) {
            return { valid: true };
        }


        const aRecords = await resolve4(domain).catch(() => []);
        if (aRecords.length > 0) {
            return { valid: true };
        }

        return { valid: false, reason: "Bu e-posta domaini (sunucusu) mevcut değil" };
    } catch (error) {
        console.error("DNS verification error:", error);

        return { valid: true };
    }
}
