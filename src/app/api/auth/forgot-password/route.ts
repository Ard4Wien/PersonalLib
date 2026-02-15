import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

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

        // Cleanup: remove expired attempts older than 24h to prevent table bloat
        await prisma.passwordResetAttempt.deleteMany({
            where: { createdAt: { lt: last24Hours } }
        });


        const ipAttempts = await prisma.passwordResetAttempt.count({
            where: {
                ip,
                createdAt: { gte: last24Hours }
            }
        });

        if (ipAttempts >= 3) {
            return NextResponse.json(
                { error: "Bu cihazdan günlük sıfırlama limitine ulaştınız (Maks 3). Lütfen yarın tekrar deneyin." },
                { status: 429 }
            );
        }


        const emailAttempts = await prisma.passwordResetAttempt.count({
            where: {
                email,
                createdAt: { gte: last24Hours }
            }
        });

        if (emailAttempts >= 3) {
            return NextResponse.json(
                { error: "Bu e-posta adresi için günlük sıfırlama limitine ulaşıldı (Maks 3). Lütfen yarın tekrar deneyin." },
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
            // Timing normalization: simulate the same work as a valid request
            // to prevent email enumeration via response timing differences
            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));
            return NextResponse.json({ message: "Sıfırlama bağlantısı gönderildi" });
        }


        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });


        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now


        await prisma.passwordResetToken.create({
            data: {
                token: hashedToken,
                expiresAt,
                userId: user.id,
            },
        });


        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

        const mailOptions = {
            from: `"PersonalLib" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Şifre Sıfırlama İsteği",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff; color: #333333;">
          <h2 style="color: #2563eb; text-align: center;">Şifre Sıfırlama</h2>
          <p>Merhaba,</p>
          <p>Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayabilirsiniz:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
          </div>
          <p>Bu bağlantı 1 saat boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777; text-align: center;">PersonalLib - Medya Arşivi</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: "Sıfırlama bağlantısı gönderildi" });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
            { status: 500 }
        );
    }
}
