"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Clock, Edit, Heart, MoreVertical, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface StatusButtonProps {
    type: "book" | "movie" | "series";
    currentStatus: string;
    onStatusChange?: (status: string) => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function StatusButton({
    type,
    currentStatus,
    onStatusChange,
    onEdit,
    onDelete,
}: StatusButtonProps) {
    const statusOptions =
        type === "book"
            ? [
                { value: "COMPLETED", label: "Okundu", icon: Check, color: "text-green-400" },
                { value: "READING", label: "Okunuyor", icon: Clock, color: "text-blue-400" },
                { value: "WISHLIST", label: "İstek Listesi", icon: Heart, color: "text-purple-400" },
                { value: "DROPPED", label: "Bırakıldı", icon: X, color: "text-red-400" },
            ]
            : [
                { value: "COMPLETED", label: "İzlendi", icon: Check, color: "text-green-400" },
                { value: "WATCHING", label: "İzleniyor", icon: Clock, color: "text-blue-400" },
                { value: "WISHLIST", label: "İstek Listesi", icon: Heart, color: "text-purple-400" },
                { value: "DROPPED", label: "Bırakıldı", icon: X, color: "text-red-400" },
            ];

    const handleStatusChange = (status: string, label: string) => {
        if (status === currentStatus) return;

        onStatusChange?.(status);

        toast.success(`${label} olarak güncellendi`, {
            description: "Durum başarıyla kaydedildi.",
            icon: <Check className="h-4 w-4 text-green-500" />,
            duration: 2000,
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow-lg border border-white/5"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-40 bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10"
            >
                <AnimatePresence mode="wait">
                    {statusOptions.map((option, index) => {
                        const Icon = option.icon;
                        const isActive = currentStatus === option.value;
                        return (
                            <motion.div
                                key={option.value}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <DropdownMenuItem
                                    onClick={() => handleStatusChange(option.value, option.label)}
                                    className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${isActive ? option.color + " bg-white/5" : "text-gray-300 hover:text-white"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{option.label}</span>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto"
                                        >
                                            <Check className="h-3 w-3" />
                                        </motion.div>
                                    )}
                                </DropdownMenuItem>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <DropdownMenuSeparator className="bg-white/10" />
                {onEdit && (
                    <DropdownMenuItem
                        onClick={onEdit}
                        className="flex items-center gap-2 cursor-pointer text-blue-400 hover:text-blue-300"
                    >
                        <Edit className="h-4 w-4" />
                        <span>Düzenle</span>
                    </DropdownMenuItem>
                )}
                {onDelete && (
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Kaldır</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
