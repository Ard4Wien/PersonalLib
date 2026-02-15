import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { checkLoginAttempt, recordFailedLogin, resetLoginAttempts } from "@/lib/rate-limiter";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const validatedFields = loginSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: "Geçersiz giriş bilgileri" },
                { status: 400 }
            );
        }

        const { email: rawEmail, password } = validatedFields.data;
        const email = rawEmail.toLowerCase();

        const lockoutStatus = checkLoginAttempt(email);
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

        if (!user || !user.passwordHash) {
            recordFailedLogin(email);
            return NextResponse.json(
                { error: "Geçersiz e-posta veya şifre" },
                { status: 401 }
            );
        }

        const passwordsMatch = await compare(password, user.passwordHash);

        if (!passwordsMatch) {
            recordFailedLogin(email);
            return NextResponse.json(
                { error: "Geçersiz e-posta veya şifre" },
                { status: 401 }
            );
        }

        resetLoginAttempts(email);

        const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

        if (!JWT_SECRET) {
            console.error("JWT_SECRET or AUTH_SECRET is not defined in environment variables");
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
    } catch (error) {
        console.error("Mobile login error:", error);
        return NextResponse.json(
            { error: "Giriş işlemi sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
