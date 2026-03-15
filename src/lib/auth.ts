import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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

                const { email: rawEmail, password } = validatedFields.data;
                const email = rawEmail.toLowerCase();


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
                    }
                });

                // Timing Attack önlemi: Kullanıcı bulunamasa bile bcrypt.compare
                // çalıştırılarak yanıt süresi sabitlenir.
                const DUMMY_HASH = "$2b$10$tnwJkrdRvkJ49DvEzHFM..AQmt3BmTjccjU2Hx/CmWp8ALvMkkWwd6";
                const hashToCompare = user?.passwordHash || DUMMY_HASH;
                const passwordsMatch = await bcrypt.compare(password, hashToCompare);

                if (!user || !user.passwordHash || !passwordsMatch) {
                    await recordFailedLogin(email);
                    return null;
                }


                await resetLoginAttempts(email);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.displayName,
                    username: user.username,
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
            }


            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.email = token.email as string;
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

