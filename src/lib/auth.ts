import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";
import { loginSchema } from "./validations";
import { checkLoginAttempt, recordFailedLogin, resetLoginAttempts } from "./rate-limiter";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const validatedFields = loginSchema.safeParse(credentials);

                if (!validatedFields.success) {
                    return null;
                }

                const { email, password } = validatedFields.data;

                // Account lockout kontrolü
                const lockoutStatus = checkLoginAttempt(email);
                if (lockoutStatus.locked) {
                    // NextAuth'da özel hata mesajı gösteremiyoruz, null dönüyoruz
                    // Ancak hesap kilitli olduğu için giriş başarısız olacak
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.passwordHash) {
                    // Başarısız denemeyi kaydet
                    recordFailedLogin(email);
                    return null;
                }

                const passwordsMatch = await compare(password, user.passwordHash);

                if (!passwordsMatch) {
                    // Başarısız denemeyi kaydet
                    recordFailedLogin(email);
                    return null;
                }

                // Başarılı giriş - sayacı sıfırla
                resetLoginAttempts(email);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.displayName,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id as string;
                token.username = (user as { username: string }).username;
                token.email = user.email;
                token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl;
            }

            // Allow updating the session manually
            if (trigger === "update" && session?.avatarUrl) {
                token.avatarUrl = session.avatarUrl;
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.email = token.email as string;
                session.user.avatarUrl = token.avatarUrl as string | null | undefined;
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

