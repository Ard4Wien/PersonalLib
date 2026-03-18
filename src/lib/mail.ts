import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const mailOptions = {
    from: `"PersonalLib" <${process.env.BREVO_SENDER_EMAIL || "personallibinfo@gmail.com"}>`,
    to: email,
    subject: "Şifre Sıfırlama İsteği",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border-radius: 16px; background-color: #ffffff; color: #1f2937; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #8b5cf6; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">PersonalLib</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Medya Arşiviniz</p>
          </div>
          
          <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Şifre Sıfırlama</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Merhaba,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi güvenli bir şekilde sıfırlamak için aşağıdaki butona tıklayabilirsiniz:</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="background-color: #8b5cf6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; transition: background-color 0.2s;">Şifremi Sıfırla</a>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <p style="font-size: 14px; margin: 0; color: #6b7280;">Bu bağlantı <strong>1 saat</strong> boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayın.</p>
        </div>
      `,
  };

  return await transporter.sendMail(mailOptions);
};
