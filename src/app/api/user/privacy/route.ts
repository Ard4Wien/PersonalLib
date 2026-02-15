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
            select: { isPrivate: true }
        });

        return NextResponse.json({ isPrivate: user?.isPrivate || false });
    } catch (error) {
        console.error("Gizlilik bilgisi hatası:", error);
        return NextResponse.json({ error: "Gizlilik bilgisi alınamadı" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { isPrivate } = body;

        if (typeof isPrivate !== "boolean") {
            return NextResponse.json({ error: "Geçersiz değer" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isPrivate }
        });

        return NextResponse.json({ success: true, isPrivate });
    } catch (error) {
        console.error("Gizlilik güncelleme hatası:", error);
        return NextResponse.json({ error: "Gizlilik ayarı güncellenemedi" }, { status: 500 });
    }
}
