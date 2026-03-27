"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { ViewModeProvider } from "@/contexts/view-mode-context";
import { SearchProvider } from "@/contexts/search-context";
import { NonceProvider } from "@/contexts/nonce-context";
import { Session } from "next-auth";

import { LanguageProvider } from "@/contexts/language-context";

interface ProvidersProps {
    children: ReactNode;
    session?: Session | null;
    nonce?: string;
}

export default function Providers({ children, session, nonce = '' }: ProvidersProps) {
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);

    return (
        <NonceProvider value={nonce}>
            <SessionProvider session={session}>
                <LanguageProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem={true}
                    >
                        <ViewModeProvider>
                            <SearchProvider>
                                {children}
                            </SearchProvider>
                        </ViewModeProvider>
                    </ThemeProvider>
                </LanguageProvider>
            </SessionProvider>
        </NonceProvider>
    );
}
