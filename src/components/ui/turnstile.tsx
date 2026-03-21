"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface TurnstileProps {
    onVerify: (token: string) => void;
    theme?: "light" | "dark" | "auto";
}

export function Turnstile({ onVerify, theme = "auto" }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    useEffect(() => {
        if (!siteKey || !isLoaded || !containerRef.current || widgetIdRef.current) return;

        const renderWidget = () => {
            if (window.turnstile) {
                widgetIdRef.current = window.turnstile.render(containerRef.current!, {
                    sitekey: siteKey,
                    callback: onVerify,
                    theme: theme,
                });
            }
        };

        renderWidget();

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [isLoaded, siteKey, onVerify, theme]);

    if (!siteKey) return null;

    return (
        <div className="flex justify-center my-4 min-h-[65px]">
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                onLoad={() => setIsLoaded(true)}
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
                }
            ) => string;
            remove: (widgetId: string) => void;
        };
    }
}
