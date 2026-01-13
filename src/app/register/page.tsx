"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { BookOpen, Film, Loader2 } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

import { motion } from "framer-motion";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            email: formData.get("email") as string,
            username: formData.get("username") as string,
            displayName: formData.get("displayName") as string,
            password: formData.get("password") as string,
        };

        const confirmPassword = formData.get("confirmPassword") as string;

        if (data.password !== confirmPassword) {
            setError("Şifreler eşleşmiyor");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error && typeof result.error === "object") {
                    // Zod validation errors (fieldErrors)
                    const fieldErrors = result.error as Record<string, string[]>;
                    const firstError = Object.values(fieldErrors)[0]?.[0];
                    setError(firstError || "Kayıt işlemi başarısız");
                } else {
                    setError(result.error || "Kayıt işlemi başarısız");
                }
                return;
            }

            router.push("/login?registered=true");
        } catch {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-zinc-950 dark:to-black p-4 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 mb-6">
                <ModeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 50 }}
                className="w-full max-w-md relative"
            >
                <Card className="bg-black/40 dark:bg-zinc-900/60 backdrop-blur-xl border-white/10 dark:border-zinc-800">
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
                        <CardTitle className="text-2xl font-bold text-white">
                            Yeni Hesap Oluştur
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Medya kütüphanenizi oluşturmaya başlayın
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
                                <Label htmlFor="email" className="text-gray-300">
                                    E-posta
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="ornek@email.com"
                                    required
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    className="bg-white/5 dark:bg-zinc-800/50 border-white/10 dark:border-zinc-700 text-white placeholder:text-gray-500 transition-all focus:scale-[1.01]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-gray-300">
                                        Kullanıcı Adı
                                    </Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="kullanici_adi"
                                        required
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        className="bg-white/5 dark:bg-zinc-800/50 border-white/10 dark:border-zinc-700 text-white placeholder:text-gray-500 transition-all focus:scale-[1.01]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="displayName" className="text-gray-300">
                                        Görünen Ad
                                    </Label>
                                    <Input
                                        id="displayName"
                                        name="displayName"
                                        type="text"
                                        placeholder="Adınız"
                                        required
                                        className="bg-white/5 dark:bg-zinc-800/50 border-white/10 dark:border-zinc-700 text-white placeholder:text-gray-500 transition-all focus:scale-[1.01]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-300">
                                    Şifre
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className="bg-white/5 dark:bg-zinc-800/50 border-white/10 dark:border-zinc-700 text-white placeholder:text-gray-500 transition-all focus:scale-[1.01]"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 pl-1">
                                    En az 8 karakter, harf ve rakam içermelidir.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-300">
                                    Şifre Tekrar
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className="bg-white/5 dark:bg-zinc-800/50 border-white/10 dark:border-zinc-700 text-white placeholder:text-gray-500 transition-all focus:scale-[1.01]"
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
                                        Kayıt yapılıyor...
                                    </>
                                ) : (
                                    "Üye Ol"
                                )}
                            </Button>

                            <p className="text-sm text-gray-400 text-center">
                                Zaten hesabınız var mı?{" "}
                                <Link
                                    href="/login"
                                    className="text-purple-400 hover:text-purple-300 transition-colors hover:underline"
                                >
                                    Giriş Yap
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>

            <footer className="mt-8 relative z-10 text-gray-500 text-sm">
                PersonalLib ile oluşturuldu 📚🎬
            </footer>
        </div>
    );
}
