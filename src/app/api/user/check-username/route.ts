import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const rateLimitResult = checkRateLimit(clientIP);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { available: false, error: rateLimitResult.message },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username")?.toLowerCase();

        if (!username || username.length < 4) {
            return NextResponse.json({ available: false, error: "Geçersiz kullanıcı adı" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        return NextResponse.json({ available: !existingUser });
    } catch (error) {
        console.error("Username check error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
