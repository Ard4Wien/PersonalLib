"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";

import { motion } from "framer-motion";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [email, setEmail] = useState("");
    const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    useEffect(() => {
        if (username.length < 4) {
            setUsernameAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingUsername(true);
            try {
                const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(username)}`);
                const data = await res.json();
                setUsernameAvailable(data.available);
            } catch (err) {
                console.error("Check username error:", err);
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setEmailSuggestion(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            email: formData.get("email") as string,
            username: formData.get("username") as string,
            displayName: formData.get("displayName") as string,
            password: formData.get("password") as string,
        };

        const confirmPassword = formData.get("confirmPassword") as string;

        if (data.username.length < 4 || data.username.length > 10) {
            setError("Kullanıcı adı 4 ile 10 karakter arasında olmalıdır");
            setIsLoading(false);
            return;
        }

        const isOnlyNumbers = (str: string) => /^\d+$/.test(str);

        if (isOnlyNumbers(data.username)) {
            setError("Kullanıcı adı sadece rakamlardan oluşamaz");
            setIsLoading(false);
            return;
        }

        if (isOnlyNumbers(data.displayName)) {
            setError("Görünen ad sadece rakamlardan oluşamaz");
            setIsLoading(false);
            return;
        }

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
                    if (result.error.suggestion) {
                        setEmailSuggestion(result.error.suggestion);
                    }
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
                            Hesap Oluştur
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Kendi medya kütüphanenizi oluşturun
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName" className="text-muted-foreground">
                                        Görünen Ad
                                    </Label>
                                    <Input
                                        id="displayName"
                                        name="displayName"
                                        type="text"
                                        placeholder="Adınız Soyadınız"
                                        required
                                        className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-muted-foreground">
                                        Kullanıcı Adı
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="kullanıcıadınız"
                                            required
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            spellCheck="false"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                            className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {isCheckingUsername ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            ) : usernameAvailable === true ? (
                                                <span className="text-green-500 text-xs font-bold">✓</span>
                                            ) : usernameAvailable === false ? (
                                                <span className="text-red-500 text-xs font-bold">✕</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    {usernameAvailable === false && (
                                        <p className="text-[10px] text-red-500 mt-1 pl-1">
                                            Bu kullanıcı adı zaten alınmış.
                                        </p>
                                    )}
                                    {usernameAvailable === true && (
                                        <p className="text-[10px] text-green-500 mt-1 pl-1">
                                            Bu kullanıcı adı müsait!
                                        </p>
                                    )}
                                </div>
                            </div>

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
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setEmailSuggestion(null);
                                    }}
                                    className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                                />
                                {emailSuggestion && (
                                    <div className="mt-2 p-2 rounded bg-purple-500/10 border border-purple-500/20 text-[11px]">
                                        <span className="text-muted-foreground">Bunu mu demek istediniz? </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEmail(emailSuggestion);
                                                setEmailSuggestion(null);
                                            }}
                                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                                        >
                                            {emailSuggestion}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-muted-foreground">
                                    Şifre
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                    className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-foreground placeholder:text-muted-foreground transition-all focus:scale-[1.01]"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 pl-1">
                                    En az 8 karakter olmalıdır.
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
                                    minLength={8}
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
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
                                        Hesap oluşturuluyor...
                                    </>
                                ) : (
                                    "Kayıt Ol"
                                )}
                            </Button>

                            <p className="text-sm text-muted-foreground text-center">
                                Zaten hesabınız var mı?{" "}
                                <Link
                                    href="/login"
                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors hover:underline"
                                >
                                    Giriş Yap
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>

            <footer className="mt-8 mb-8 relative z-10 text-muted-foreground text-sm">
                PersonalLib ile oluşturuldu 📚🎬
            </footer>
        </div>
    );
}
