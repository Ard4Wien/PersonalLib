import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/mobile-auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2 || query.length > 100) {
            return NextResponse.json({ error: "Arama terimi 2-100 karakter arasında olmalıdır" }, { status: 400 });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } }
                ],
                NOT: { id: userId }
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
        return NextResponse.json({ error: "Arama yapılırken bir hata oluştu" }, { status: 500 });
    }
}
