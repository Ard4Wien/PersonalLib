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

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json({ error: "Arama terimi en az 2 karakter olmalıdır" }, { status: 400 });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } }
                ],
                NOT: { id: userId } // Kendi profilini arama sonuçlarında gizle
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                isPrivate: true
            },
            take: 20
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Kullanıcı arama hatası:", error);
        return NextResponse.json({ error: "Arama yapılırken bir hata oluştu" }, { status: 500 });
    }
}
