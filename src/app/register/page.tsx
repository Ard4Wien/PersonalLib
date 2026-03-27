import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import { RegisterForm } from "@/components/auth/register-form";
import * as motion from "framer-motion/client";
import { AuthFooter } from "@/components/auth/auth-footer";

export default function RegisterPage() {
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
                <RegisterForm />
            </motion.div>

            <AuthFooter />
        </div>
    );
}
