"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
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

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
                redirect: false,
            });

            if (result?.error) {
                setError("E-posta veya şifre hatalı");
            } else {
                router.push("/books");
                router.refresh();
            }
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
                            Hoş Geldiniz
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Medya kütüphanenize giriş yapın
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
                                    className="bg-white/5 dark:bg-zinc-800/50 border-white/10 dark:border-zinc-700 text-white placeholder:text-gray-500 transition-all focus:scale-[1.01]"
                                />
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
                                        Giriş yapılıyor...
                                    </>
                                ) : (
                                    "Giriş Yap"
                                )}
                            </Button>

                            <p className="text-sm text-gray-400 text-center">
                                Hesabınız yok mu?{" "}
                                <Link
                                    href="/register"
                                    className="text-purple-400 hover:text-purple-300 transition-colors hover:underline"
                                >
                                    Üye Ol
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
