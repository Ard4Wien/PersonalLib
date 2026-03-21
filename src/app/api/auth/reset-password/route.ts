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
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/,
            "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir"
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
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Geçersiz veya süresi dolmuş bağlantı. Lütfen bilgilerinizi kontrol ediniz." },
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
        console.error("Reset password hatası");
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
            { status: 500 }
        );
    }
}
