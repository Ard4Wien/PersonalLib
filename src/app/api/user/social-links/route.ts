import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isSafeUrl } from "@/lib/sanitize";

// İzin verilen sosyal medya platformları
const ALLOWED_SOCIAL_KEYS = ['twitter', 'instagram', 'github', 'linkedin', 'youtube', 'tiktok', 'website', 'discord', 'twitch', 'spotify'];
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
        const sanitizedLinks: Record<string, string> = {};
        for (const [key, value] of entries) {
            // Anahtar beyaz listede mi?
            if (!ALLOWED_SOCIAL_KEYS.includes(key.toLowerCase())) {
                return NextResponse.json({ error: `Geçersiz platform: ${key}` }, { status: 400 });
            }

            // Boş değer = silme
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                continue;
            }

            if (typeof value !== 'string') {
                return NextResponse.json({ error: `${key} değeri metin olmalıdır` }, { status: 400 });
            }

            // Uzunluk kontrolü
            if (value.length > MAX_LINK_LENGTH) {
                return NextResponse.json({ error: `${key} linki en fazla ${MAX_LINK_LENGTH} karakter olabilir` }, { status: 400 });
            }

            // URL güvenlik kontrolü (javascript:, data: vb. engelle)
            if (!isSafeUrl(value)) {
                return NextResponse.json({ error: `${key} linki geçersiz veya güvenli değil` }, { status: 400 });
            }

            sanitizedLinks[key.toLowerCase()] = value.trim();
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
