import { Suspense } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, KeyRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthFooter } from "@/components/auth/auth-footer";

export const metadata = {
    title: "Şifre Sıfırlama | PersonalLib",
    description: "Yeni şifrenizi belirleyin",
};

export default function ResetPasswordPage() {
    return (
        <div className={BACKGROUND_GRADIENT + " items-center justify-center p-4 transition-colors duration-500 min-h-screen"}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 mb-6">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md relative z-10 flex items-center justify-center">
                <Suspense fallback={
                    <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-black/5 dark:border-zinc-800 shadow-xl w-full max-w-md h-[400px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                    </Card>
                }>
                    <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-black/5 dark:border-zinc-800 shadow-xl w-full max-w-md">
                        <CardHeader className="text-center space-y-4">
                            <div className="flex justify-center gap-2">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Lock className="h-6 w-6 text-white" />
                                </div>
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                    <KeyRound className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-foreground">
                                Yeni Şifre Belirle
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Hesabınız için yeni ve güvenli bir şifre girin
                            </CardDescription>
                        </CardHeader>
                        <ResetPasswordForm />
                    </Card>
                </Suspense>
            </div>

            <AuthFooter />
        </div>
    );
}
