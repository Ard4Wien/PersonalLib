import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import prisma from "./prisma";
import { loginSchema } from "./validations";
import { checkLoginAttempt, recordFailedLogin, resetLoginAttempts } from "./rate-limiter";
import { validateTurnstile } from "./turnstile";
import { validateRecaptcha } from "./recaptcha";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                turnstileToken: { label: "Turnstile Token", type: "text" },
                recaptchaToken: { label: "reCaptcha Token", type: "text" },
            },
            async authorize(credentials) {
                const validatedFields = loginSchema.safeParse(credentials);

                if (!validatedFields.success) {
                    return null;
                }

                const { email: rawEmail, password } = validatedFields.data;
                const turnstileToken = credentials?.turnstileToken as string;
                const recaptchaToken = credentials?.recaptchaToken as string;
                const email = rawEmail.toLowerCase();

                // Sunucu tarafı header'larından IP adresi çıkarma
                const headersList = await headers();
                const clientIp = headersList.get("x-real-ip")
                    || headersList.get("cf-connecting-ip")
                    || headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
                    || headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
                    || "unknown";

                // reCaptcha Doğrulaması (Birincil)
                if (process.env.RECAPTCHA_SECRET_KEY) {
                    const isValid = await validateRecaptcha(recaptchaToken);
                    if (!isValid) return null;
                } 
                // Turnstile Doğrulaması (Yedek/Eski - Sadece reCaptcha yoksa)
                else if (process.env.TURNSTILE_SECRET_KEY) {
                    const isValid = await validateTurnstile(turnstileToken);
                    if (!isValid) return null;
                }


                const lockoutStatus = await checkLoginAttempt(email);
                if (lockoutStatus.locked) {

                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        passwordHash: true,
                        displayName: true,
                        username: true,
                        image: true,
                    }
                });

                // Timing Attack önlemi: Kullanıcı bulunamasa bile bcrypt.compare
                // çalıştırılarak yanıt süresi sabitlenir.
                const DUMMY_HASH = "$2b$10$tnwJkrdRvkJ49DvEzHFM..AQmt3BmTjccjU2Hx/CmWp8ALvMkkWwd6";
                const hashToCompare = user?.passwordHash || DUMMY_HASH;
                const passwordsMatch = await bcrypt.compare(password, hashToCompare);

                if (!user || !user.passwordHash || !passwordsMatch) {
                    await recordFailedLogin(email, clientIp);
                    return null;
                }


                await resetLoginAttempts(email);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.displayName,
                    username: user.username,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // 1. İlk Giriş (Initial Sign In)
            if (user) {
                token.id = user.id as string;
                token.username = (user as { username: string }).username;
                token.email = user.email;
                token.picture = (user as any).image;
            }
            
            // 2. Dinamik Güncelleme (update() çağrıldığında)
            if (trigger === "update" && session?.image) {
                token.picture = session.image;
            } 

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.email = token.email as string;
                session.user.image = token.picture as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        newUser: "/register",
    },
    session: {
        strategy: "jwt",
    },
    trustHost: true,
});

