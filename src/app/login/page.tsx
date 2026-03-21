import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import { LoginForm } from "@/components/auth/login-form";
import * as motion from "framer-motion/client";

export default function LoginPage() {
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
                <LoginForm />
            </motion.div>

            <footer className="mt-8 relative z-10 text-center space-y-2">
                <p className="text-muted-foreground text-sm">PersonalLib ile oluşturuldu 📚🎬</p>
                <div className="flex justify-center gap-3 text-xs text-muted-foreground/70">
                    <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:underline">Kullanım Koşulları</Link>
                    <span>•</span>
                    <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:underline">Gizlilik Politikası</Link>
                </div>
            </footer>
        </div>
    );
}
