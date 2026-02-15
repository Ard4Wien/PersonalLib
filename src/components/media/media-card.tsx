import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusButton from "./status-button";
import { useViewMode } from "@/contexts/view-mode-context";
import { getOptimizedImageUrl } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Star } from "lucide-react";
import { ClientImage } from "./client-image";

export interface MediaCardProps {
    id: string;
    title: string;
    subtitle: string;
    coverImage?: string | null;
    type: "book" | "movie" | "series";
    status: string;
    genre?: string | null;
    href: string;
    isFavorite?: boolean;
    onStatusChange?: (id: string, status: string) => void;
    onFavoriteToggle?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    lastSeason?: number | null;
    lastEpisode?: number | null;
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const mobileItemVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 }
};

const statusLabels = {
    book: {
        COMPLETED: "Okundu",
        READING: "Okunuyor",
        WISHLIST: "İstek Listesi",
        DROPPED: "Bırakıldı",
    },
    movie: {
        COMPLETED: "İzlendi",
        WATCHING: "İzleniyor",
        WISHLIST: "İstek Listesi",
        DROPPED: "Bırakıldı",
    },
    series: {
        COMPLETED: "İzlendi",
        WATCHING: "İzleniyor",
        WISHLIST: "İstek Listesi",
        DROPPED: "Bırakıldı",
    },
} as const;

const getStatusColor = (s: string) => {
    switch (s) {
        case "COMPLETED":
            return "bg-green-600/90 text-white border-green-400/40 shadow-sm";
        case "READING":
        case "WATCHING":
            return "bg-blue-600/90 text-white border-blue-400/40 shadow-sm";
        case "WISHLIST":
            return "bg-purple-600/90 text-white border-purple-400/40 shadow-sm";
        case "DROPPED":
            return "bg-red-600/90 text-white border-red-400/40 shadow-sm";
        default:
            return "bg-zinc-800/90 text-white border-zinc-600/40 shadow-sm";
    }
};

const MediaCardContent = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => {
    if (href === "#") {
        return <div className={className}>{children}</div>;
    }
    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
};

export default function MediaCard({
    id,
    title,
    subtitle,
    coverImage,
    type,
    status,
    genre,
    href,
    isFavorite = false,
    onStatusChange,
    onFavoriteToggle,
    onEdit,
    onDelete,
    lastSeason,
    lastEpisode
}: MediaCardProps) {
    const { viewMode } = useViewMode();
    const isMobile = useIsMobile();
    const variants = isMobile ? mobileItemVariants : itemVariants;

    if (viewMode === "list") {
        return (
            <motion.div
                variants={variants}
                whileHover={isMobile ? {} : { x: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <Card className="group relative flex items-center p-3 bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-purple-500/40 hover:bg-white/80 dark:hover:bg-white/[0.08] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
                    <MediaCardContent href={href} className="flex-1 flex items-center w-full min-w-0 pr-4">
                        <div className="flex flex-col items-start text-left min-w-0 w-full">
                            <div className="flex items-center gap-2 w-full">
                                <h3 className="font-bold text-foreground text-base md:text-lg line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate w-fit">
                                    {title}
                                </h3>
                                {isFavorite && (
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground font-medium line-clamp-1 truncate w-full">{subtitle}</p>
                        </div>
                    </MediaCardContent>

                    <MediaCardContent href={href} className="absolute right-[56px] md:right-[70px] top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 text-right">
                        <Badge className={`text-[10px] md:text-xs font-semibold py-0.5 md:py-1 px-2 md:px-3 md:backdrop-blur-sm border shadow-sm ${getStatusColor(status)}`}>
                            {statusLabels[type][status as keyof (typeof statusLabels)[typeof type]] || status}
                            {type === "series" && status !== "COMPLETED" && status !== "WISHLIST" && lastSeason && lastEpisode && (
                                ` • S${lastSeason} B${lastEpisode}`
                            )}
                        </Badge>
                        {genre && (
                            <span className="text-[10px] md:text-[11px] text-gray-500 font-semibold px-2 uppercase tracking-wider opacity-90 md:opacity-60 line-clamp-1">
                                {genre.split(',')[0].trim()}
                            </span>
                        )}
                    </MediaCardContent>

                    <div className="absolute right-4 top-4 z-10">
                        <StatusButton
                            type={type}
                            currentStatus={status}
                            isFavorite={isFavorite}
                            onStatusChange={(newStatus) => onStatusChange?.(id, newStatus)}
                            onFavoriteToggle={() => onFavoriteToggle?.(id)}
                            onEdit={() => onEdit?.(id)}
                            onDelete={() => onDelete?.(id)}
                        />
                    </div>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={variants}
            className="h-full transform-gpu"
            whileHover={isMobile ? {} : { y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <Card className="group h-full relative overflow-hidden bg-white dark:bg-zinc-900 md:bg-white/50 md:dark:bg-white/5 border-black/5 dark:border-white/10 md:hover:border-purple-500/40 transition-all duration-300 md:hover:shadow-2xl md:hover:shadow-purple-500/10 p-0 gap-0 shadow-sm">
                <Link href={href} className="block">
                    <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900 border-b border-white/5">
                        <ClientImage
                            src={getOptimizedImageUrl(coverImage || "", 600)}
                            alt={title}
                            fill
                            unoptimized={true}
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            fallbackText={title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-2 left-2 z-10"
                        >
                            {genre && (
                                <Badge
                                    variant="secondary"
                                    className="bg-black/80 md:bg-black/40 text-white/90 text-[10px] font-bold md:text-xs md:backdrop-blur-md border border-white/10 shadow-lg"
                                >
                                    {genre.split(',')[0].trim()}
                                </Badge>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-2 right-2 z-10"
                        >
                            <Badge
                                className={`text-[10px] md:text-xs font-bold shadow-lg md:backdrop-blur-md border ${getStatusColor(status)}`}
                            >
                                {statusLabels[type][status as keyof (typeof statusLabels)[typeof type]] || status}
                                {type === "series" && status !== "COMPLETED" && status !== "WISHLIST" && lastSeason && lastEpisode && (
                                    ` • S${lastSeason} B${lastEpisode}`
                                )}
                            </Badge>
                        </motion.div>

                        {isFavorite && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute bottom-2 left-2 z-10"
                            >
                                <div className="bg-yellow-400/90 text-black p-1 rounded-full shadow-lg backdrop-blur-sm border border-yellow-200/50">
                                    <Star className="h-3 w-3 fill-current" />
                                </div>
                            </motion.div>
                        )}
                    </div>
                    <div className="p-3 md:p-4 space-y-1.5 md:space-y-2">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-foreground text-[15px] md:text-base line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                                {title}
                            </h3>
                        </div>
                        <p className="text-[13px] md:text-sm text-muted-foreground italic line-clamp-1">{subtitle}</p>
                    </div>
                </Link>
                <div className="absolute bottom-3 md:bottom-5 right-2 flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0">
                    <StatusButton
                        type={type}
                        currentStatus={status}
                        isFavorite={isFavorite}
                        onStatusChange={(newStatus) => onStatusChange?.(id, newStatus)}
                        onFavoriteToggle={() => onFavoriteToggle?.(id)}
                        onEdit={() => onEdit?.(id)}
                        onDelete={() => onDelete?.(id)}
                    />
                </div>
            </Card>
        </motion.div>
    );
}
