import { motion } from "framer-motion";
import MediaCard, { MediaCardProps } from "./media-card";
import { useViewMode } from "@/contexts/view-mode-context";

interface MediaGridProps {
    items: Omit<MediaCardProps, "onStatusChange" | "onDelete" | "onEdit">[];
    onStatusChange?: (id: string, status: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

export default function MediaGrid({
    items,
    onStatusChange,
    onEdit,
    onDelete,
    emptyMessage = "Henüz içerik eklenmemiş",
}: MediaGridProps) {
    const { viewMode } = useViewMode();

    if (items.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400 text-lg">{emptyMessage}</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={container}
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
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </motion.div>
    );
}
