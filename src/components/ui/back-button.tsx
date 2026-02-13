"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
    const router = useRouter();

    const handleBack = () => {
        if (typeof window !== "undefined") {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                router.push("/");
            }
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            onClick={handleBack}
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
        </Button>
    );
}
