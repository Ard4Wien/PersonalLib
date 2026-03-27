"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import { useTranslation } from "@/contexts/language-context";

export default function NotFound() {
    const { t } = useTranslation();

    return (
        <div className={BACKGROUND_GRADIENT + " items-center justify-center p-4 text-center transition-colors duration-500"}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative z-10 space-y-8 max-w-md w-full"
            >
                {/* 404 Visual */}
                <div className="relative">
                    <motion.div
                        animate={{ 
                            y: [0, -20, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center backdrop-blur-3xl border border-white/10 shadow-2xl"
                    >
                        <FileQuestion className="h-16 w-16 text-purple-500 dark:text-purple-400" />
                    </motion.div>
                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground/20 to-foreground/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
                        404
                    </h1>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">
                        {t.errors.notFoundTitle}
                    </h2>
                    <p className="text-muted-foreground text-lg px-4">
                        {t.errors.notFoundDesc}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link href="/">
                        <Button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 gap-2">
                            <Home className="h-4 w-4" />
                            {t.errors.backToHome}
                        </Button>
                    </Link>
                    <Button 
                        variant="outline" 
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto h-12 px-8 rounded-xl border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-all gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t.errors.goBack}
                    </Button>
                </div>
            </motion.div>

            {/* Footer decoration */}
            <div className="absolute bottom-8 text-muted-foreground/40 text-sm font-medium tracking-widest uppercase">
                PersonalLib Security Hardened
            </div>
        </div>
    );
}
