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

export default function ChangePasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

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
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {

                if (typeof result.error === "object") {
                    Object.entries(result.error).forEach(([field, messages]) => {
                        toast.error((messages as string[])[0]);
                    });
                } else {
                    toast.error(result.error || "Şifre değiştirilemedi");
                }
                return;
            }

            toast.success("Şifreniz başarıyla değiştirildi");
            reset();
            router.push("/books");
        } catch (error) {
            toast.error("Bir hata oluştu");
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
                    className="mb-6 text-gray-400 hover:text-white"
                >
                    <Link href="/books">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Geri Dön
                    </Link>
                </Button>

                <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                <Lock className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-2xl text-white">Şifre Değiştir</CardTitle>
                        </div>
                        <CardDescription className="text-gray-400">
                            Hesabınızın güvenliği için şifrenizi buradan güncelleyebilirsiniz.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" title="Mevcut Şifre" className="text-gray-300">Mevcut Şifre</Label>
                                <PasswordInput
                                    id="currentPassword"
                                    placeholder="••••••••"
                                    className="bg-white/5 border-white/10 text-white focus:border-purple-500"
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                    {...register("currentPassword")}
                                />
                                {errors.currentPassword && (
                                    <p className="text-xs text-red-400">{errors.currentPassword.message}</p>
                                )}
                            </div>

                            <DropdownMenuSeparator className="bg-white/5 !my-6" />

                            <div className="space-y-2">
                                <Label htmlFor="newPassword" title="Yeni Şifre" className="text-gray-300">Yeni Şifre</Label>
                                <PasswordInput
                                    id="newPassword"
                                    placeholder="••••••••"
                                    className="bg-white/5 border-white/10 text-white focus:border-purple-500"
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                    {...register("newPassword")}
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    <ShieldCheck className="h-3 w-3 text-gray-500" />
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                        En az 8 karakter, harf ve rakam içermeli
                                    </p>
                                </div>
                                {errors.newPassword && (
                                    <p className="text-xs text-red-400">{errors.newPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" title="Yeni Şifre (Tekrar)" className="text-gray-300">Yeni Şifre (Tekrar)</Label>
                                <PasswordInput
                                    id="confirmPassword"
                                    placeholder="••••••••"
                                    className="bg-white/5 border-white/10 text-white focus:border-purple-500"
                                    showPassword={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                                )}
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
                                        Güncelleniyor...
                                    </>
                                ) : (
                                    "Şifreyi Güncelle"
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
