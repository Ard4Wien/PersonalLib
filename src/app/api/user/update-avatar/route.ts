import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateAvatarSchema = z.object({
    avatarUrl: z.string().min(1, "Resim verisi gereklidir"),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
        }

        const body = await request.json();

        // Validation
        const result = updateAvatarSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        const { avatarUrl } = result.data;

        // Base64 string çok büyük olabilir, ancak PostgreSQL TEXT tipi 1GB'a kadar veri tutabilir.
        // Yine de çok büyük dosyaları engellemek iyi olabilir ama crop'lanmış avatar genelde küçüktür.

        await prisma.user.update({
            where: { email: session.user.email },
            data: { avatarUrl },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Avatar update error:", error);
        return NextResponse.json(
            { error: "Avatar güncellenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
