"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-14 h-7 rounded-full bg-white/10" />;
    }

    const isDark = resolvedTheme === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <div
            onClick={toggleTheme}
            className={`relative w-16 h-8 rounded-full cursor-pointer p-1 transition-all duration-300 border ${isDark
                ? "bg-slate-900/50 border-white/10 hover:border-purple-500/30"
                : "bg-black/5 border-black/10 hover:border-purple-500/20"
                }`}
            role="switch"
            aria-checked={isDark}
            aria-label="Temayı Değiştir"
        >
            <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)] ${isDark
                    ? "bg-[#0c0c0e] text-purple-400"
                    : "bg-white text-yellow-500 shadow-sm"
                    }`}
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                style={{
                    marginLeft: isDark ? "auto" : "0",
                    marginRight: isDark ? "0" : "auto",
                }}
            >
                {isDark ? (
                    <Moon className="h-4 w-4" />
                ) : (
                    <Sun className="h-4 w-4" />
                )}
            </motion.div>
        </div>
    );
}
