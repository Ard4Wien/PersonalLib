import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { headers } from "next/headers";
import { validateTurnstile } from "@/lib/turnstile";
import { validateRecaptcha } from "@/lib/recaptcha";
import { getClientIP, checkRateLimit } from "@/lib/rate-limiter";

import { passwordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token gereklidir"),
    password: passwordSchema,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const ip = getClientIP(request);

        // Siber Güvenlik: IP tabanlı genel hız sınırı kontrolü
        const rateLimit = await checkRateLimit(ip);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: "Çok fazla deneme yaptınız. Lütfen bir süre bekleyin." },
                { status: 429 }
            );
        }

        const { token, password, turnstileToken, recaptchaToken } = body;

        // Siber Güvenlik: Bot Koruması Doğrulaması (Hybrid)
        // reCaptcha Doğrulaması (Birincil)
        if (process.env.RECAPTCHA_SECRET_KEY) {
            const isValid = await validateRecaptcha(recaptchaToken);
            if (!isValid) {
                return NextResponse.json({ error: "reCaptcha doğrulaması başarısız oldu." }, { status: 403 });
            }
        }
        // Turnstile Doğrulaması (Yedek - Sadece reCaptcha anahtarı yoksa çalışır)
        else if (process.env.TURNSTILE_SECRET_KEY) {
            const isValid = await validateTurnstile(turnstileToken);
            if (!isValid) {
                return NextResponse.json({ error: "Bot doğrulaması başarısız oldu." }, { status: 403 });
            }
        }

        const validatedFields = resetPasswordSchema.safeParse({ token, password });
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

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
