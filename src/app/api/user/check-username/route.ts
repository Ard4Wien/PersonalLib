import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
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
