import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/mobile-auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { languageSchema } from "@/lib/validations";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { language: true }
        });

        return NextResponse.json({ language: user?.language || "tr" });
    } catch (error) {
        console.error("Dil alma hatası:", error);
        return NextResponse.json({ error: "Dil bilgisi alınamadı" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        // Rate Limiting (Güvenlik için eklendi)
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const body = await request.json();
        
        // Merkezi şema ile doğrulama (tr, en, fr, de)
        const validated = languageSchema.safeParse(body.language);
        if (!validated.success) {
            return NextResponse.json({ error: "Geçersiz dil seçimi" }, { status: 400 });
        }

        const language = validated.data;

        await prisma.user.update({
            where: { id: userId },
            data: { language }
        });

        return NextResponse.json({ success: true, language });
    } catch (error) {
        return NextResponse.json({ error: "Dil ayarı güncellenemedi" }, { status: 500 });
    }
}
