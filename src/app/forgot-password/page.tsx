import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Film } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import { motion } from "framer-motion";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
    title: "Şifremi Unuttum | PersonalLib",
    description: "Hesap şifrenizi sıfırlayın",
};

export default function ForgotPasswordPage() {
    return (
        <div className={BACKGROUND_GRADIENT + " items-center justify-center p-4 transition-colors duration-500 min-h-screen"}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 mb-6">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md relative z-10">
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
                            Şifrenizi sıfırlamak için e-posta adresinizi girin
                        </CardDescription>
                    </CardHeader>

                    <ForgotPasswordForm />
                </Card>
            </div>

            <footer className="mt-8 relative z-10 text-gray-500 text-sm">
                PersonalLib ile oluşturuldu 📚🎬
            </footer>
        </div>
    );
}
