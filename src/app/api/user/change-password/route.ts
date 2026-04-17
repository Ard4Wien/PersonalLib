import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { changePasswordSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/lib/mobile-auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { validateTurnstile } from "@/lib/turnstile";
import { validateRecaptcha } from "@/lib/recaptcha";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);

        if (!userId) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Rate Limiting
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: rateLimitResult.message },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateLimitResult.retryAfter || 60)
                    }
                }
            );
        }

        const body = await request.json();
        const { turnstileToken, recaptchaToken, ...fields } = body;

        // Bot Koruması (Hibrit)
        if (process.env.RECAPTCHA_SECRET_KEY) {
            const isValid = await validateRecaptcha(recaptchaToken);
            if (!isValid) return NextResponse.json({ error: "Güvenlik doğrulaması başarısız (reCaptcha)." }, { status: 403 });
        } else if (process.env.TURNSTILE_SECRET_KEY) {
            const isValid = await validateTurnstile(turnstileToken);
            if (!isValid) return NextResponse.json({ error: "Güvenlik doğrulaması başarısız (Turnstile)." }, { status: 403 });
        }

        const validatedFields = changePasswordSchema.safeParse(fields);

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
            await bcrypt.compare("dummy_password", "$2b$10$tnwJkrdRvkJ49DvEzHFM..AQmt3BmTjccjU2Hx/CmWp8ALvMkkWwd6");
            const delay = Math.floor(Math.random() * 200) + 100;
            await new Promise(resolve => setTimeout(resolve, delay));

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
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
            { status: 500 }
        );
    }
}
