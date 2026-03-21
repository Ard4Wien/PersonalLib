"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { motion } from "framer-motion";

export function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Geçersiz veya eksik bağlantı. Lütfen tekrar şifre sıfırlama talebinde bulunun.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor");
            setIsLoading(false);
            return;
        }

        // Şifre Güvenlik Kontrolleri
        if (password.length < 8) {
            setError("Şifre en az 8 karakter olmalıdır");
            setIsLoading(false);
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError("Şifre en az bir büyük harf içermelidir");
            setIsLoading(false);
            return;
        }

        if (!/[0-9]/.test(password)) {
            setError("Şifre en az bir rakam içermelidir");
            setIsLoading(false);
            return;
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            setError("Şifre en az bir özel karakter içermelidir");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Bir hata oluştu");
            }

            setIsSubmitted(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message);
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
                <p className="text-gray-300">
                    Şifreniz başarıyla sıfırlandı. Giriş sayfasına yönlendiriliyorsunuz...
                </p>
                <Button
                    asChild
                    variant="link"
                    className="text-purple-400"
                >
                    <Link href="/login">Hemen Giriş Yap</Link>
                </Button>
            </CardContent>
        );
    }

    if (!token && !error) return null;

    return (
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex items-center justify-center gap-2"
                    >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </motion.div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-muted-foreground">
                        Yeni Şifre
                    </Label>
                    <PasswordInput
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                        className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                    />
                    <p className="text-[11px] text-muted-foreground/70 px-1 italic">
                        * En az 8 karakter, bir büyük harf, bir rakam ve bir özel karakter içermelidir.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-muted-foreground">
                        Şifre Tekrar
                    </Label>
                    <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="••••••••"
                        required
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                        className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                    />
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-6">
                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-[1.02]"
                    disabled={isLoading || (!!error && !token)}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Güncelleniyor...
                        </>
                    ) : (
                        "Şifreyi Güncelle"
                    )}
                </Button>

                {error && !token && (
                    <Link
                        href="/forgot-password"
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors hover:underline text-center"
                    >
                        Yeni bir bağlantı iste
                    </Link>
                )}
            </CardFooter>
        </form>
    );
}
