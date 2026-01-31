import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "E-posta ve şifre gereklidir" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
            return NextResponse.json(
                { error: "Geçersiz e-posta veya şifre" },
                { status: 401 }
            );
        }

        const passwordsMatch = await compare(password, user.passwordHash);

        if (!passwordsMatch) {
            return NextResponse.json(
                { error: "Geçersiz e-posta veya şifre" },
                { status: 401 }
            );
        }


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
            { expiresIn: "30d", algorithm: "HS256" }
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
