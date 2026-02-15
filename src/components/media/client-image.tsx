"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Image as ImageIcon } from "lucide-react";

interface ClientImageProps extends ImageProps {
    fallbackText?: string;
    aspectRatio?: "portrait" | "square" | "landscape";
}

export function ClientImage({ fallbackText, aspectRatio = "portrait", ...props }: ClientImageProps) {
    const [error, setError] = useState(false);

    if (error || !props.src) {
        return (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-800 to-zinc-950`}>
                <ImageIcon className="h-8 w-8 text-white/20 mb-2" />
                {fallbackText && (
                    <div className="text-white/40 font-bold text-xs uppercase tracking-tighter line-clamp-2 select-none px-2">
                        {fallbackText}
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-4 text-white/20 text-[8px] font-bold uppercase tracking-[0.2em]">
                    Görsel Bulunamadı
                </div>
            </div>
        );
    }

    return (
        <Image
            {...props}
            onError={() => setError(true)}
        />
    );
}
