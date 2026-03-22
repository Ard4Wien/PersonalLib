import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/mobile-auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { privacySchema } from "@/lib/validations";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPrivate: true }
        });

        return NextResponse.json({ isPrivate: user?.isPrivate || false });
    } catch (error) {
        return NextResponse.json({ error: "Gizlilik bilgisi alınamadı" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        // Rate Limiting (Güvenlik)
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const body = await request.json();
        const validated = privacySchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Geçersiz değer" }, { status: 400 });
        }

        const { isPrivate } = validated.data;

        await prisma.user.update({
            where: { id: userId },
            data: { isPrivate }
        });

        return NextResponse.json({ success: true, isPrivate });
    } catch (error) {
        return NextResponse.json({ error: "Gizlilik ayarı güncellenemedi" }, { status: 500 });
    }
}
