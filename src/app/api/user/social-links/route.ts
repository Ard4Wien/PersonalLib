import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { containsHtml, isSafeUrl } from "@/lib/sanitize";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

// İzin verilen sosyal medya platformları
const ALLOWED_SOCIAL_KEYS = ['x', 'instagram', 'github', 'linkedin', 'youtube', 'tiktok', 'discord', 'twitch', 'spotify'];
const MAX_LINK_LENGTH = 500;
const MAX_LINK_COUNT = 10;

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { socialLinks: true },
    });

    return NextResponse.json({ socialLinks: user?.socialLinks || {} });
}

export async function PATCH(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting (Güvenlik)
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP);
    if (!rateLimitResult.success) {
        return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { socialLinks } = body;

        if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
            return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
        }

        const entries = Object.entries(socialLinks);

        // Maks link sayısı kontrolü
        if (entries.length > MAX_LINK_COUNT) {
            return NextResponse.json({ error: `En fazla ${MAX_LINK_COUNT} link ekleyebilirsiniz` }, { status: 400 });
        }

        // Her linki doğrula
        const sanitizedLinks: Record<string, any> = {};
        for (const [key, value] of entries) {
            // Anahtar beyaz listede mi?
            if (!ALLOWED_SOCIAL_KEYS.includes(key.toLowerCase())) {
                return NextResponse.json({ error: `Geçersiz platform: ${key}` }, { status: 400 });
            }

            // Boş değer = silme
            if (!value) continue;

            const platformKey = key.toLowerCase();

            // Nesne formatı {u: username, v: visibility} (Yeni format)
            if (typeof value === 'object' && !Array.isArray(value)) {
                const valObj = value as any;
                const username = valObj.u || valObj.username || "";
                const isVisible = valObj.v !== undefined ? (valObj.v === 1 ? 1 : 0) : (valObj.isVisible !== false ? 1 : 0);

                if (username.length > MAX_LINK_LENGTH) {
                    return NextResponse.json({ error: `${key} kullanıcı adı çok uzun` }, { status: 400 });
                }

                // Kullanıcı adı güvenliği (HTML/Script engelle)
                if (containsHtml(username)) {
                    return NextResponse.json({ error: `${key} geçersiz içerik barındırıyor` }, { status: 400 });
                }

                sanitizedLinks[platformKey] = {
                    u: username.trim(),
                    v: isVisible
                };
            } 
            // Metin formatı (Eski/Basit format)
            else if (typeof value === 'string') {
                if (value.trim() === '') continue;

                if (value.length > MAX_LINK_LENGTH) {
                    return NextResponse.json({ error: `${key} linki çok uzun` }, { status: 400 });
                }

                // Kullanıcı adı/URL güvenliği (HTML/Script engelle)
                if (containsHtml(value)) {
                    return NextResponse.json({ error: `${key} geçersiz içerik barındırıyor` }, { status: 400 });
                }

                sanitizedLinks[platformKey] = {
                    u: value.trim(),
                    v: 1
                };
            }
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { socialLinks: sanitizedLinks },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
