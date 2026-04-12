import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { checkLoginAttempt, recordFailedLogin, resetLoginAttempts, getClientIP, checkRateLimit } from "@/lib/rate-limiter";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const ip = getClientIP(request);

        // Rate limit kontrolü
        const rateLimit = await checkRateLimit(ip);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: rateLimit.message || "Çok fazla istek. Lütfen biraz bekleyin." },
                { status: 429 }
            );
        }

        const validatedFields = loginSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: "Geçersiz giriş bilgileri" },
                { status: 400 }
            );
        }

        const { email: rawEmail, password } = validatedFields.data;
        const email = rawEmail.toLowerCase();

        const lockoutStatus = await checkLoginAttempt(email);
        if (lockoutStatus.locked) {
            return NextResponse.json(
                { error: lockoutStatus.message },
                {
                    status: 429,
                    headers: { "Retry-After": String(lockoutStatus.retryAfter || 900) }
                }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Timing attack önlemi
        const DUMMY_HASH = "$2b$10$tnwJkrdRvkJ49DvEzHFM..AQmt3BmTjccjU2Hx/CmWp8ALvMkkWwd6";
        const hashToCompare = user?.passwordHash || DUMMY_HASH;
        const passwordsMatch = await compare(password, hashToCompare);

        if (!user || !user.passwordHash || !passwordsMatch) {
            await recordFailedLogin(email, ip);
            return NextResponse.json(
                { error: "Geçersiz e-posta veya şifre" },
                { status: 401 }
            );
        }


        await resetLoginAttempts(email);

        const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

        if (!JWT_SECRET) {
            console.error("JWT_SECRET veya AUTH_SECRET ortam değişkenlerinde tanımlı değil");
            return NextResponse.json(
                { error: "Sunucu yapılandırma hatası" },
                { status: 500 }
            );
        }

        const token = sign(
            {
                userId: user.id,
                email: user.email,
                username: user.username
            },
            JWT_SECRET,
            { expiresIn: "7d", algorithm: "HS256" }
        );

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
            },
        });
    } catch {
        console.error("mobile login fail");
        return NextResponse.json(
            { error: "Girdiğiniz bilgiler hatalı olabilir veya bir bağlantı sorunu oluştu" },
            { status: 500 }
        );
    }
}
