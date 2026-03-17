import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { available: false, error: rateLimitResult.message },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email")?.toLowerCase();

        if (!email) {
            return NextResponse.json({ available: false, error: "Geçersiz e-posta" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });

        return NextResponse.json({ available: !existingUser });
    } catch (error) {
        console.error("Email check error:", error instanceof Error ? error.message : "Bilinmeyen hata");
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
