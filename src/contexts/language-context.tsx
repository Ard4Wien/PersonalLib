"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { translations, type Locale, type TranslationKeys } from "@/lib/translations";

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [locale, setLocaleState] = useState<Locale>("tr");
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial load: prioritize DB language, fallback to localStorage or browser language
    useEffect(() => {
        const stored = localStorage.getItem("preferredLanguage") as Locale | null;
        
        if (stored && translations[stored]) {
            setLocaleState(stored);
        } else {
            // No stored preference, try to detect from browser
            const browserLang = navigator.language.split("-")[0] as Locale;
            if (translations[browserLang]) {
                setLocaleState(browserLang);
                localStorage.setItem("preferredLanguage", browserLang);
            }
        }

        if (session?.user) {
            fetch("/api/user/language")
                .then(res => res.json())
                .then(data => {
                    if (data.language && translations[data.language as Locale]) {
                        setLocaleState(data.language as Locale);
                        localStorage.setItem("preferredLanguage", data.language);
                    }
                })
                .catch(() => { });
        }

        setIsInitialized(true);
    }, [session?.user]);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("preferredLanguage", newLocale);
    }, []);

    const t = translations[locale] || translations.tr;

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.lang = locale;
            // Set cookie for server-side lang attribute
            document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
        }
    }, [locale]);

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
