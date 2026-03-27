"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useNonce } from "@/contexts/nonce-context";

interface TurnstileProps {
    onVerify: (token: string) => void;
    theme?: "light" | "dark" | "auto";
}

export function Turnstile({ onVerify, theme = "auto" }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const nonce = useNonce();

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // Script zaten yüklüyse (client-side navigation durumunda onLoad tekrar tetiklenmez)
    useEffect(() => {
        if (typeof window !== "undefined" && typeof window.turnstile !== "undefined") {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!siteKey || !isLoaded || !containerRef.current || widgetIdRef.current) return;

        const renderWidget = () => {
            if (window.turnstile && containerRef.current) {
                try {
                    widgetIdRef.current = window.turnstile.render(containerRef.current, {
                        sitekey: siteKey,
                        callback: onVerify,
                        theme: theme,
                        appearance: "interaction-only",
                    });
                } catch {
                    // Widget zaten render edilmiş olabilir
                }
            }
        };

        renderWidget();

        return () => {
            if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // Widget zaten kaldırılmış olabilir
                }
                widgetIdRef.current = null;
            }
        };
    }, [isLoaded, siteKey, onVerify, theme]);

    if (!siteKey) return null;

    return (
        <div className="flex justify-center">
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                onLoad={() => setIsLoaded(true)}
                nonce={nonce}
            />
            <div ref={containerRef} id="turnstile-container" />
        </div>
    );
}

declare global {
    interface Window {
        turnstile: {
            render: (
                container: string | HTMLElement,
                options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    theme?: string;
                    appearance?: "always" | "execute" | "interaction-only";
                }
            ) => string;
            remove: (widgetId: string) => void;
        };
    }
}
