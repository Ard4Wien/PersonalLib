import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { validateEmailDomain } from "@/lib/email-validator";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {

        const clientIP = getClientIP(request);
        const rateLimitResult = checkRateLimit(clientIP);

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
        const validatedFields = registerSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { email: rawEmail, username: rawUsername, displayName, password } = validatedFields.data;
        const email = rawEmail.toLowerCase();
        const username = rawUsername.toLowerCase();


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

        if (existingUserByEmail) {
            return NextResponse.json(
                { error: "Bu e-posta adresi zaten kullanılıyor" },
                { status: 400 }
            );
        }

        if (existingUserByUsername) {
            return NextResponse.json(
                { error: "Bu kullanıcı adı zaten kullanılıyor" },
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
    } catch (error) {
        console.error("Kayıt hatası:", error);
        return NextResponse.json(
            { error: "Kayıt işlemi sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}

