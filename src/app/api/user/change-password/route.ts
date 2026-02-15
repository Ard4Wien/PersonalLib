import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { changePasswordSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);

        if (!userId) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedFields = changePasswordSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = validatedFields.data;


        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }


        const isPasswordMatch = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isPasswordMatch) {
            return NextResponse.json(
                { error: { currentPassword: ["Mevcut şifre hatalı"] } },
                { status: 400 }
            );
        }


        const hashedPassword = await bcrypt.hash(newPassword, 10);


        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword }
        });

        return NextResponse.json(
            { message: "Şifreniz başarıyla güncellendi" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Şifre değiştirme hatası:", error);
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
            { status: 500 }
        );
    }
}
