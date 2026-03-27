"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import Link from "next/link";
import { useTranslation } from "@/contexts/language-context";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const { t } = useTranslation();

    useEffect(() => {
        // Log the error to an error reporting service if needed
        console.error("Runtime error caught by segment boundary:", error);
    }, [error]);

    return (
        <div className={BACKGROUND_GRADIENT + " items-center justify-center p-4 text-center transition-colors duration-500"}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 space-y-8 max-w-lg w-full"
            >
                {/* Error Visual */}
                <div className="relative">
                    <motion.div
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                            duration: 5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="mx-auto w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center backdrop-blur-3xl border border-red-500/20 shadow-2xl"
                    >
                        <AlertTriangle className="h-16 w-16 text-red-500/80" />
                    </motion.div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">
                        {t.errors.errorTitle}
                    </h2>
                    <p className="text-muted-foreground text-lg px-6 leading-relaxed">
                        {t.errors.errorDesc}
                    </p>
                    {error.digest && (
                        <div className="inline-block px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-xs font-mono text-muted-foreground/60 border border-black/5 dark:border-white/10 select-all">
                            {t.errors.errorCode}: {error.digest}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button 
                        onClick={() => reset()}
                        className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-xl shadow-red-500/20 transition-all hover:scale-105 active:scale-95 gap-2"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        {t.errors.tryAgain}
                    </Button>
                    <Link href="/">
                        <Button 
                            variant="outline"
                            className="w-full sm:w-auto h-12 px-8 rounded-xl border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-all gap-2"
                        >
                            <Home className="h-4 w-4" />
                            {t.errors.backToHome}
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Footer decoration */}
            <div className="absolute bottom-8 text-muted-foreground/40 text-sm font-medium tracking-widest uppercase">
                PersonalLib Error Protection v1.0
            </div>
        </div>
    );
}
