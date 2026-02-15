import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token gereklidir"),
    password: z
        .string()
        .min(8, "Şifre en az 8 karakter olmalıdır")
        .max(100, "Şifre en fazla 100 karakter olabilir")
        .regex(
            /^(?=.*[a-zA-Z])(?=.*\d)/,
            "Şifre en az bir harf ve bir rakam içermelidir"
        ),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const validatedFields = resetPasswordSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { token, password } = validatedFields.data;

        // Gelen token'ı DB'deki hash ile karşılaştırmak için hash'le
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token: hashedToken },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: "Geçersiz sıfırlama bağlantısı" },
                { status: 400 }
            );
        }

        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            });
            return NextResponse.json(
                { error: "Sıfırlama bağlantısının süresi dolmuş" },
                { status: 400 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

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
