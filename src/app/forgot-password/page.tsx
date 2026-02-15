"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { BookOpen, Film, ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

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
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Bir hata oluştu");
            }

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={BACKGROUND_GRADIENT + " items-center justify-center p-4 transition-colors duration-500"}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 mb-6">
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 50 }}
                className="w-full max-w-md relative"
            >
                <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-black/5 dark:border-zinc-800 shadow-xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="flex justify-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                <Film className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                            Şifremi Unuttum
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {isSubmitted
                                ? "Sıfırlama bağlantısı gönderildi"
                                : "Şifrenizi sıfırlamak için e-posta adresinizi girin"}
                        </CardDescription>
                    </CardHeader>

                    {!isSubmitted ? (
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
                                        E-posta
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        required
                                        className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 pt-6">
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-[1.02]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        "Sıfırlama Bağlantısı Gönder"
                                    )}
                                </Button>

                                <Link
                                    href="/login"
                                    className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Giriş Yap'a Geri Dön
                                </Link>
                            </CardFooter>
                        </form>
                    ) : (
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
                                        Eğer bu e-posta adresiyle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısını e-posta kutunuzda göreceksiniz.
                                    </p>
                                    <p className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg">
                                        Not: Mailin tarafınıza ulaşması 5 ila 15 dakika arasında değişebilir.
                                    </p>
                                    <p className="text-xs text-gray-500 italic">
                                        Lütfen Spam/Gereksiz kutusunu kontrol etmeyi unutmayın.
                                    </p>
                                </div>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full border-white/10 hover:bg-white/5 text-white"
                            >
                                <Link href="/login">Giriş Yap'a Geri Dön</Link>
                            </Button>
                        </CardContent>
                    )}
                </Card>
            </motion.div>

            <footer className="mt-8 relative z-10 text-gray-500 text-sm">
                PersonalLib ile oluşturuldu 📚🎬
            </footer>
        </div>
    );
}
