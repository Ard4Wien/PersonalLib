"use client";

import { useEffect, useState } from "react";
import { MediaGrid } from "@/components/media";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Film, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WishlistItem {
    id: string;
    type: "book" | "movie" | "series";
    title: string;
    subtitle: string;
    coverImage: string | null;
    genre: string | null;
    href: string;
    status: string;
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const [booksRes, moviesRes, seriesRes] = await Promise.all([
                fetch("/api/books"),
                fetch("/api/movies"),
                fetch("/api/series"),
            ]);

            const wishlistItems: WishlistItem[] = [];

            if (booksRes.ok) {
                const books = await booksRes.json();
                books
                    .filter((b: { status: string }) => b.status === "WISHLIST")
                    .forEach((b: { id: string; book: { id: string; title: string; author: string; coverImage: string | null; genre: string | null } }) => {
                        wishlistItems.push({
                            id: b.id,
                            type: "book",
                            title: b.book.title,
                            subtitle: b.book.author,
                            coverImage: b.book.coverImage,
                            genre: b.book.genre,
                            href: `/books/${b.book.id}`,
                            status: "WISHLIST",
                        });
                    });
            }

            if (moviesRes.ok) {
                const movies = await moviesRes.json();
                movies
                    .filter((m: { status: string }) => m.status === "WISHLIST")
                    .forEach((m: { id: string; movie: { id: string; title: string; director: string; coverImage: string | null; genre: string | null } }) => {
                        wishlistItems.push({
                            id: m.id,
                            type: "movie",
                            title: m.movie.title,
                            subtitle: m.movie.director,
                            coverImage: m.movie.coverImage,
                            genre: m.movie.genre,
                            href: `/movies/${m.movie.id}`,
                            status: "WISHLIST",
                        });
                    });
            }

            if (seriesRes.ok) {
                const series = await seriesRes.json();
                series
                    .filter((s: { overallStatus: string }) => s.overallStatus === "WISHLIST")
                    .forEach((s: { id: string; series: { id: string; title: string; creator: string; coverImage: string | null; genre: string | null } }) => {
                        wishlistItems.push({
                            id: s.id,
                            type: "series",
                            title: s.series.title,
                            subtitle: s.series.creator,
                            coverImage: s.series.coverImage,
                            genre: s.series.genre,
                            href: `/series/${s.series.id}`,
                            status: "WISHLIST",
                        });
                    });
            }

            setItems(wishlistItems);
        } catch (error) {
            console.error("İstek listesi yüklenemedi:", error);
            toast.error("İstek listesi yüklenirken bir hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredItems = items.filter((item) => {
        if (activeTab === "all") return true;
        if (activeTab === "books") return item.type === "book";
        if (activeTab === "movies") return item.type === "movie" || item.type === "series";
        return true;
    });

    const bookCount = items.filter((i) => i.type === "book").length;
    const mediaCount = items.filter((i) => i.type === "movie" || i.type === "series").length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                    <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">İstek Listem</h1>
                    <p className="text-gray-400 text-sm">
                        {items.length} içerik bekliyor
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 text-gray-300 data-[state=active]:text-white hover:text-white">
                        Tümü ({items.length})
                    </TabsTrigger>
                    <TabsTrigger value="books" className="data-[state=active]:bg-purple-600 text-gray-300 data-[state=active]:text-white hover:text-white">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Kitaplar ({bookCount})
                    </TabsTrigger>
                    <TabsTrigger value="movies" className="data-[state=active]:bg-blue-600 text-gray-300 data-[state=active]:text-white hover:text-white">
                        <Film className="h-4 w-4 mr-2" />
                        Film & Dizi ({mediaCount})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <MediaGrid
                        items={filteredItems}
                        emptyMessage="İstek listeniz boş"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
