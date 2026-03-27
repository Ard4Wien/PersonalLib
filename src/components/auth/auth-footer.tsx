"use client";

import Link from "next/link";
import { useTranslation } from "@/contexts/language-context";

export function AuthFooter() {
    const { t } = useTranslation();

    return (
        <footer className="mt-8 relative z-10 text-center space-y-2">
            <p className="text-muted-foreground text-sm">{t.portfolio.footer}</p>
            <div className="flex justify-center gap-3 text-xs text-muted-foreground/70">
                <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:underline">
                    {t.terms.title}
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:underline">
                    {t.privacy.title}
                </Link>
            </div>
        </footer>
    );
}
