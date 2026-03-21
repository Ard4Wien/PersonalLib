import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

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
        console.error("Dil hatası");
        return NextResponse.json({ error: "Dil bilgisi alınamadı" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { language } = body;

        const supportedLanguages = ["tr", "en", "fr", "de"];
        if (!supportedLanguages.includes(language)) {
            return NextResponse.json({ error: "Geçersiz dil" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { language }
        });

        return NextResponse.json({ success: true, language });
    } catch (error) {
        console.error("Dil hatası");
        return NextResponse.json({ error: "Dil ayarı güncellenemedi" }, { status: 500 });
    }
}
