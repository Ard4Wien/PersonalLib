import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { validateEmailDomain } from "@/lib/email-validator";
import { validateTurnstile } from "@/lib/turnstile";
import { validateRecaptcha } from "@/lib/recaptcha";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
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
        const { turnstileToken, recaptchaToken } = body;

        const mobileSecret = request.headers.get("x-mobile-app-secret");
        const isMobileRequest = mobileSecret && mobileSecret === process.env.MOBILE_APP_SECRET;

        if (!isMobileRequest) {
            // reCaptcha Doğrulaması
            if (process.env.RECAPTCHA_SECRET_KEY) {
                const isValid = await validateRecaptcha(recaptchaToken);
                if (!isValid) {
                    return NextResponse.json({ error: "reCaptcha doğrulaması başarısız." }, { status: 403 });
                }
            }
            // Turnstile Doğrulaması
            else if (process.env.TURNSTILE_SECRET_KEY) {
                const isValid = await validateTurnstile(turnstileToken);
                if (!isValid) {
                    return NextResponse.json({ error: "Bot doğrulaması başarısız." }, { status: 403 });
                }
            }
        }

        const validatedFields = registerSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { email, username, displayName, password } = validatedFields.data;

        // Email Domain Kontrolü
        const domainValidation = await validateEmailDomain(email);
        if (!domainValidation.valid) {
            return NextResponse.json(
                { error: { email: [domainValidation.reason || "Geçersiz e-posta sunucusu"] } },
                { status: 400 }
            );
        }

        if (domainValidation.suggestion) {
            return NextResponse.json(
                {
                    error: {
                        email: ["E-posta adresinizde yazım hatası olabilir mi?"],
                        suggestion: domainValidation.suggestion
                    }
                },
                { status: 400 }
            );
        }

        const [existingUserByEmail, existingUserByUsername] = await Promise.all([
            prisma.user.findUnique({ where: { email } }),
            prisma.user.findUnique({ where: { username } }),
        ]);

        if (existingUserByEmail || existingUserByUsername) {
            const DUMMY_HASH = "$2b$10$tnwJkrdRvkJ49DvEzHFM..AQmt3BmTjccjU2Hx/CmWp8ALvMkkWwd6";
            await bcrypt.compare(password, DUMMY_HASH); // Hash hesaplama yükü ekle
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100)); // Rastgele gecikme

            return NextResponse.json(
                { error: "Girdiğiniz bilgilerle zaten bir hesap mevcut. Lütfen bilgilerinizi kontrol ediniz." },
                { status: 400 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                displayName,
                passwordHash,
            },
        });

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.displayName,
                },
            },
            { status: 201 }
        );
    } catch {
        console.error("register fail");
        return NextResponse.json(
            { error: "Kayıt olurken bir sorun çıktı, lütfen tekrar dene." },
            { status: 500 }
        );
    }
}
