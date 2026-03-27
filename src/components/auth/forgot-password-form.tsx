"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Turnstile } from "@/components/ui/turnstile";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { useTranslation } from "@/contexts/language-context";

export function ForgotPasswordForm() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email,
                    turnstileToken,
                    recaptchaToken
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // API'den gelen kontrollü hata mesajını göster
                setError(data.error || t.common.tryAgain);
                return;
            }

            setIsSubmitted(true);
        } catch {
            // Ağ hatası veya JSON parse hatası — dahili bilgi sızdırmamak için genel mesaj
            setError(t.common.tryAgain);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <CardContent className="text-center space-y-6 py-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex justify-center"
                >
                    <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                </motion.div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-gray-300">
                            {t.auth.resetEmailSent}
                        </p>
                        <p className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg">
                            {t.auth.resetEmailNote}
                        </p>
                        <p className="text-xs text-gray-500 italic">
                            {t.auth.checkSpam}
                        </p>
                    </div>
                </div>
                <Button
                    asChild
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5 text-white"
                >
                    <Link href="/login">{t.auth.backToLogin}</Link>
                </Button>
            </CardContent>
        );
    }

    return (
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
                        className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                    />
                </div>

                {/* Bot Koruması (Görünmez Mod) */}
                <div className="space-y-4">
                    <ReCaptcha onVerify={setRecaptchaToken} />
                    {!recaptchaToken && <Turnstile onVerify={setTurnstileToken} />}
                </div>
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
                            {t.common.sending}
                        </>
                    ) : (
                        t.auth.sendResetLink
                    )}
                </Button>

                <Link
                    href="/login"
                    className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t.auth.backToLogin}
                </Link>
            </CardFooter>
        </form>
    );
}
