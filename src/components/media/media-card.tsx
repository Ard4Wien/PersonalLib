import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusButton from "./status-button";

export interface MediaCardProps {
    id: string;
    title: string;
    subtitle: string;
    coverImage?: string | null;
    type: "book" | "movie" | "series";
    status: string;
    genre?: string | null;
    href: string;
    onStatusChange?: (id: string, status: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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
    onStatusChange,
    onEdit,
    onDelete,
}: MediaCardProps) {
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
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "COMPLETED":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "READING":
            case "WATCHING":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "WISHLIST":
                return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            case "DROPPED":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
        >
            <Card className="group h-full relative overflow-hidden bg-white/5 border-white/10 hover:border-purple-500/50 transition-colors duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
                <Link href={href} className="block">
                    <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                        {coverImage ? (
                            <Image
                                src={coverImage}
                                alt={title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-6xl text-gray-600">
                                    {type === "book" ? "📚" : type === "movie" ? "🎬" : "📺"}
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute top-2 left-2 z-10"
                        >
                            {genre && (
                                <Badge
                                    variant="secondary"
                                    className="bg-black/60 text-white text-[10px] md:text-xs backdrop-blur-sm border-white/10"
                                >
                                    {genre}
                                </Badge>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute top-2 right-2 z-10"
                        >
                            <Badge
                                className={`text-[10px] md:text-xs shadow-lg ${getStatusColor(status)}`}
                            >
                                {statusLabels[type][status as keyof (typeof statusLabels)[typeof type]] || status}
                            </Badge>
                        </motion.div>
                    </div>
                    <div className="p-3 md:p-4 space-y-1 md:space-y-2">
                        <h3 className="font-semibold text-white text-sm md:text-base line-clamp-1 group-hover:text-purple-300 transition-colors">
                            {title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-400 italic line-clamp-1">{subtitle}</p>
                    </div>
                </Link>
                <motion.div
                    className="absolute bottom-20 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                >
                    <StatusButton
                        type={type}
                        currentStatus={status}
                        onStatusChange={(newStatus) => onStatusChange?.(id, newStatus)}
                        onEdit={() => onEdit?.(id)}
                        onDelete={() => onDelete?.(id)}
                    />
                </motion.div>
            </Card>
        </motion.div>
    );
}
