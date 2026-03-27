"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { BookOpen, Film, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Turnstile } from "@/components/ui/turnstile";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { useTranslation } from "@/contexts/language-context";

export function LoginForm() {
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                turnstileToken, // Mevcut Turnstile desteği
                recaptchaToken, // Yeni reCaptcha desteği
                redirect: false,
            });

            if (result?.error) {
                setError(t.auth.loginError);
                setIsLoading(false);
            } else {
                window.location.href = "/books";
            }
        } catch {
            setError(t.common.tryAgain);
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-black/5 dark:border-zinc-800 shadow-xl">
            <CardHeader className="text-center space-y-4">
                <div className="flex justify-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500"
                    >
                        <BookOpen className="h-6 w-6 text-white" />
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500"
                    >
                        <Film className="h-6 w-6 text-white" />
                    </motion.div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                    {t.auth.welcome}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    {t.auth.loginDescription}
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-muted-foreground">
                            {t.auth.email}
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={t.auth.emailPlaceholder}
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-muted-foreground">
                                {t.auth.password}
                            </Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors hover:underline"
                            >
                                {t.auth.forgotPassword}
                            </Link>
                        </div>
                        <PasswordInput
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                        />
                    </div>

                    {/* Turnstile Widget (Optional/Legacy) */}
                    {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                        <Turnstile onVerify={setTurnstileToken} theme="auto" />
                    )}

                    {/* reCaptcha v2 Widget (Primary Security) */}
                    {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                        <ReCaptcha onVerify={setRecaptchaToken} theme="light" />
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-6">
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-[1.02]"
                        disabled={
                            isLoading || 
                            ((!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) && 
                             (!turnstileToken && !recaptchaToken))
                        }
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.auth.loggingIn}
                            </>
                        ) : (
                            t.auth.login
                        )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        {t.auth.noAccount}{" "}
                        <Link
                            href="/register"
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors hover:underline"
                        >
                            {t.auth.register}
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
