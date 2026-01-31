"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getOptimizedImageUrl } from "@/lib/utils";

interface MediaSearchResult {
    id: string | number;
    title: string;
    subtitle?: string;
    author?: string;
    director?: string;
    creator?: string;
    description?: string;
    coverImage: string;
    publishedYear?: number;
    releaseYear?: number;
    startYear?: number;
    genre?: string;
    pageCount?: number;
    totalSeasons?: number;
    isbn?: string;
}

interface MediaSearchProps {
    type: "book" | "movie" | "series";
    onSelect: (item: MediaSearchResult) => void;
}

export function MediaSearch({ type, onSelect }: MediaSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<MediaSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const endpoint = type === "series" ? "series" : `${type}s`;
            const response = await fetch(`/api/search/${endpoint}?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();

                setResults(data as MediaSearchResult[]);
                if ((data as MediaSearchResult[]).length === 0) {
                    toast.info("Sonuç bulunamadı");
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || "Arama yapılırken bir hata oluştu";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Arama hatası:", error);
            toast.error("Bir ağ hatası oluştu");
        } finally {
            setIsSearching(false);
        }
    };

    const typeLabels = {
        book: "Kitap",
        movie: "Film",
        series: "Dizi",
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`İnternette ${typeLabels[type]} ara...`}
                        className="pl-9 bg-white/5 border-white/10 text-white focus:ring-purple-500"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ara"}
                </Button>
            </form>

            {results.length > 0 && (
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {results.map((result) => (
                        <div
                            key={result.id}
                            onClick={() => {
                                onSelect(result);
                                setResults([]);
                                setQuery("");
                            }}
                            className="flex items-start gap-3 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors group"
                        >
                            <div className="relative h-16 w-12 flex-shrink-0 rounded bg-slate-800 overflow-hidden">
                                {result.coverImage ? (
                                    <Image
                                        src={getOptimizedImageUrl(result.coverImage, 200)}
                                        alt={result.title}
                                        fill
                                        unoptimized={true}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-gray-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white truncate group-hover:text-purple-400">
                                    {result.title}
                                </h4>
                                <p className="text-xs text-gray-400 truncate">
                                    {result.author || result.director || result.creator || ""}
                                    {(result.publishedYear || result.releaseYear || result.startYear) &&
                                        ` • ${result.publishedYear || result.releaseYear || result.startYear}`}
                                    {result.genre && ` • ${result.genre}`}
                                    {type === "series" && result.totalSeasons && ` • ${result.totalSeasons} Sezon`}
                                </p>
                            </div>
                            <Plus className="h-4 w-4 text-gray-500 group-hover:text-white self-center" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
