import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token ve şifre gereklidir" },
                { status: 400 }
            );
        }

        // Find and validate token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: "Geçersiz sıfırlama bağlantısı" },
                { status: 400 }
            );
        }

        if (resetToken.expiresAt < new Date()) {
            // Delete expired token
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            });
            return NextResponse.json(
                { error: "Sıfırlama bağlantısının süresi dolmuş" },
                { status: 400 }
            );
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update user password and delete the token in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            }),
            prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            }),
        ]);

        return NextResponse.json({ message: "Şifre başarıyla güncellendi" });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
            { status: 500 }
        );
    }
}
