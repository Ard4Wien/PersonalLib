"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Loader2, ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";
import Link from "next/link";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations";
import { Turnstile } from "@/components/ui/turnstile";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { useTranslation } from "@/contexts/language-context";

export default function ChangePasswordPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ChangePasswordInput>({
        resolver: zodResolver(changePasswordSchema),
    });

    const onSubmit = async (data: ChangePasswordInput) => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    turnstileToken,
                    recaptchaToken,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (typeof result.error === "object") {
                    Object.entries(result.error).forEach(([field, messages]) => {
                        toast.error((messages as string[])[0]);
                    });
                } else {
                    toast.error(result.error || t.changePassword.failed);
                }
                return;
            }

            toast.success(t.changePassword.success);
            reset();
            router.push("/books");
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedPage>
            <div className="container max-w-lg mx-auto py-10 px-4">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-6 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <Link href="/books">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        {t.common.back}
                    </Link>
                </Button>

                <Card className="bg-white dark:bg-slate-950/50 border-black/5 dark:border-white/10 backdrop-blur-xl shadow-xl">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                <Lock className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-2xl text-foreground">{t.changePassword.title}</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground">
                            {t.changePassword.description}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" title={t.changePassword.currentPassword} className="text-foreground/80">{t.changePassword.currentPassword}</Label>
                                <PasswordInput
                                    id="currentPassword"
                                    placeholder="••••••••"
                                    className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground dark:text-white focus:border-purple-500"
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                    {...register("currentPassword")}
                                />
                                {errors.currentPassword && (
                                    <p className="text-xs text-red-400">{errors.currentPassword.message}</p>
                                )}
                            </div>

                            <DropdownMenuSeparator className="bg-black/5 dark:bg-white/5 !my-6" />

                            <div className="space-y-2">
                                <Label htmlFor="newPassword" title={t.changePassword.newPassword} className="text-foreground/80">{t.changePassword.newPassword}</Label>
                                <PasswordInput
                                    id="newPassword"
                                    placeholder="••••••••"
                                    className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground dark:text-white focus:border-purple-500"
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                    {...register("newPassword")}
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    <ShieldCheck className="h-3 w-3 text-gray-500" />
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                        {t.changePassword.passwordHint}
                                    </p>
                                </div>
                                {errors.newPassword && (
                                    <p className="text-xs text-red-400">{errors.newPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" title={t.changePassword.confirmPassword} className="text-foreground/80">{t.changePassword.confirmPassword}</Label>
                                <PasswordInput
                                    id="confirmPassword"
                                    placeholder="••••••••"
                                    className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground dark:text-white focus:border-purple-500"
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {/* Bot Koruması (Görünmez Mod) */}
                            <div>
                                <ReCaptcha onVerify={setRecaptchaToken} />
                                {!recaptchaToken && <Turnstile onVerify={setTurnstileToken} />}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t.common.updating}
                                    </>
                                ) : (
                                    t.changePassword.updateButton
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AnimatedPage>
    );
}


function DropdownMenuSeparator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full ${className}`} />;
}
