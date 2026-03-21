"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface ReCaptchaProps {
    onVerify: (token: string | null) => void;
    theme?: "light" | "dark";
    size?: "normal" | "compact";
}

export function ReCaptcha({ onVerify, theme = "light", size = "normal" }: ReCaptchaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const widgetIdRef = useRef<number | null>(null);

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    useEffect(() => {
        if (!siteKey || !isLoaded || !containerRef.current || widgetIdRef.current !== null) return;

        const renderWidget = () => {
            if (window.grecaptcha && window.grecaptcha.render) {
                widgetIdRef.current = window.grecaptcha.render(containerRef.current!, {
                    sitekey: siteKey,
                    callback: onVerify,
                    "expired-callback": () => onVerify(null),
                    "error-callback": () => onVerify(null),
                    theme: theme,
                    size: size,
                });
            }
        };

        // grecaptcha.render bazen script yüklense de hemen hazır olmayabilir
        const checkAndRender = () => {
            if (typeof window.grecaptcha !== "undefined" && typeof window.grecaptcha.render === "function") {
                renderWidget();
            } else {
                setTimeout(checkAndRender, 100);
            }
        };

        checkAndRender();

        return () => {
            // Cleanup if needed (reCaptcha v2 doesn't have a simple standard reset/remove for individual widgets without ID)
        };
    }, [isLoaded, siteKey, onVerify, theme, size]);

    if (!siteKey) return null;

    return (
        <div className="flex justify-center my-4 min-h-[78px]">
            <Script
                src="https://www.google.com/recaptcha/api.js?render=explicit"
                onLoad={() => setIsLoaded(true)}
                strategy="afterInteractive"
            />
            <div ref={containerRef} />
        </div>
    );
}

declare global {
    interface Window {
        grecaptcha: {
            render: (
                container: string | HTMLElement,
                options: {
                    sitekey: string;
                    callback: (token: string | null) => void;
                    "expired-callback"?: () => void;
                    "error-callback"?: () => void;
                    theme?: string;
                    size?: string;
                }
            ) => number;
            reset: (widgetId?: number) => void;
        };
    }
}
