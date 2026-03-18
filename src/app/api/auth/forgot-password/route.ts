import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();


        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

        if (!email) {
            return NextResponse.json(
                { error: "E-posta adresi gerekli" },
                { status: 400 }
            );
        }


        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 24 saatten eski sıfırlama denemelerini temizle
        await prisma.passwordResetAttempt.deleteMany({
            where: { createdAt: { lt: last24Hours } }
        });


        const ipAttempts = await prisma.passwordResetAttempt.count({
            where: {
                ip,
                createdAt: { gte: last24Hours }
            }
        });

        if (ipAttempts >= 5) {
            return NextResponse.json(
                { error: "Bu cihazdan günlük sıfırlama limitine ulaştınız (Maks 5). Lütfen yarın tekrar deneyin." },
                { status: 429 }
            );
        }


        const emailAttempts = await prisma.passwordResetAttempt.count({
            where: {
                email,
                createdAt: { gte: last24Hours }
            }
        });

        if (emailAttempts >= 5) {
            return NextResponse.json(
                { error: "Bu e-posta adresi için günlük sıfırlama limitine ulaşıldı (Maks 5). Lütfen yarın tekrar deneyin." },
                { status: 429 }
            );
        }


        await prisma.passwordResetAttempt.create({
            data: { email, ip }
        });

        const user = await prisma.user.findUnique({
            where: { email },
        });


        if (!user) {
            // Zamanlama normalizasyonu: e-posta ifşasını önlemek için sabit gecikme
            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));
            return NextResponse.json({ message: "Sıfırlama bağlantısı gönderildi" });
        }


        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });


        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 3600000);


        await prisma.passwordResetToken.create({
            data: {
                token: hashedToken,
                expiresAt,
                userId: user.id,
            },
        });


        const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;
        await sendPasswordResetEmail(email, resetUrl);

        return NextResponse.json({ message: "Sıfırlama bağlantısı gönderildi" });
    } catch (error) {
        console.error("Forgot password error:", error instanceof Error ? error.message : "Bilinmeyen hata");
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
            { status: 500 }
        );
    }
}
