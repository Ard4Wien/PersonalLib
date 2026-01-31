"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { ViewModeProvider } from "@/contexts/view-mode-context";
import { SearchProvider } from "@/contexts/search-context";

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
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
        <SessionProvider>
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
        </SessionProvider>
    );
}
