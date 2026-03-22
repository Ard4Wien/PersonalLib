import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { usernameSchema } from "@/lib/validations";

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
        const usernameParam = searchParams.get("username");

        if (!usernameParam) {
            return NextResponse.json({ available: false, error: "Kullanıcı adı gereklidir" }, { status: 400 });
        }

        // Merkezi validation şemasını kullan (uzunluk, karakter, küfür vb. hepsi dahil)
        const validated = usernameSchema.safeParse(usernameParam);
        
        if (!validated.success) {
            return NextResponse.json({ 
                available: false, 
                error: validated.error.issues[0]?.message || "Geçersiz kullanıcı adı" 
            });
        }

        const username = validated.data;

        const existingUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        return NextResponse.json({ available: !existingUser });
    } catch (error) {
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
