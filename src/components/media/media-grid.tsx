import { motion } from "framer-motion";
import MediaCard, { MediaCardProps } from "./media-card";
import { useViewMode } from "@/contexts/view-mode-context";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface MediaGridProps {
    items: Omit<MediaCardProps, "onStatusChange" | "onDelete" | "onEdit" | "onFavoriteToggle">[];
    onStatusChange?: (id: string, status: string) => void;
    onFavoriteToggle?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03
        }
    }
};

const mobileContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            duration: 0
        }
    }
};

export default function MediaGrid({
    items,
    onStatusChange,
    onFavoriteToggle,
    onEdit,
    onDelete,
    emptyMessage = "Henüz içerik eklenmemiş",
}: MediaGridProps) {
    const { viewMode } = useViewMode();
    const isMobile = useIsMobile();
    const variants = isMobile ? mobileContainer : container;

    if (items.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="text-6xl mb-4">📭</div>
                <p className="text-muted-foreground text-lg">{emptyMessage}</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="show"
            className={viewMode === "list"
                ? "flex flex-col gap-3"
                : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            }
        >
            {items.map((item) => (
                <MediaCard
                    key={item.id}
                    {...item}
                    onStatusChange={onStatusChange}
                    onFavoriteToggle={onFavoriteToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </motion.div>
    );
}
