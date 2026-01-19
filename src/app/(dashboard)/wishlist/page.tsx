"use client";

import { useEffect, useState } from "react";
import { MediaGrid } from "@/components/media";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AnimatedPage from "@/components/layout/animated-page";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BookOpen, Check, Clock, Film, Heart, Loader2, X } from "lucide-react";
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
    originalData: any;
}

const statusOptions = [
    { value: "WISHLIST", label: "İstek Listesi", icon: Heart, color: "text-purple-400" },
    { value: "WATCHING", label: "İzleniyor", icon: Clock, color: "text-blue-400" },
    { value: "READING", label: "Okunuyor", icon: Clock, color: "text-blue-400" },
    { value: "COMPLETED", label: "Tamamlandı", icon: Check, color: "text-green-400" },
    { value: "DROPPED", label: "Bırakıldı", icon: X, color: "text-red-400" },
];

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit states
    const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editStatus, setEditStatus] = useState("WISHLIST");

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
                    .forEach((b: any) => {
                        wishlistItems.push({
                            id: b.id,
                            type: "book",
                            title: b.book.title,
                            subtitle: b.book.author,
                            coverImage: b.book.coverImage,
                            genre: b.book.genre,
                            href: `/books/${b.book.id}`,
                            status: "WISHLIST",
                            originalData: b,
                        });
                    });
            }

            if (moviesRes.ok) {
                const movies = await moviesRes.json();
                movies
                    .filter((m: { status: string }) => m.status === "WISHLIST")
                    .forEach((m: any) => {
                        wishlistItems.push({
                            id: m.id,
                            type: "movie",
                            title: m.movie.title,
                            subtitle: m.movie.director,
                            coverImage: m.movie.coverImage,
                            genre: m.movie.genre,
                            href: `/movies/${m.movie.id}`,
                            status: "WISHLIST",
                            originalData: m,
                        });
                    });
            }

            if (seriesRes.ok) {
                const series = await seriesRes.json();
                series
                    .filter((s: { overallStatus: string }) => s.overallStatus === "WISHLIST")
                    .forEach((s: any) => {
                        wishlistItems.push({
                            id: s.id,
                            type: "series",
                            title: s.series.title,
                            subtitle: s.series.creator,
                            coverImage: s.series.coverImage,
                            genre: s.series.genre,
                            href: `/series/${s.series.id}`,
                            status: "WISHLIST",
                            originalData: s,
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

    const handleEdit = (id: string) => {
        const item = items.find((i) => i.id === id);
        if (item) {
            setEditingItem(item);
            setEditStatus(item.status);
            setIsEditDialogOpen(true);
        }
    };

    const handleEditBook = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== "book") return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            userBookId: editingItem.id,
            bookId: editingItem.originalData.book.id,
            title: formData.get("title") as string,
            author: formData.get("author") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            status: editStatus,
        };

        try {
            const response = await fetch("/api/books", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Kitap güncellendi!");
                setIsEditDialogOpen(false);
                setEditingItem(null);
                fetchWishlist(); // Refresh list to get updated data
            } else {
                const error = await response.json();
                toast.error(error.error || "Kitap güncellenemedi");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditMovie = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== "movie") return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            userMovieId: editingItem.id,
            movieId: editingItem.originalData.movie.id,
            title: formData.get("title") as string,
            director: formData.get("director") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            status: editStatus,
        };

        try {
            const response = await fetch("/api/movies", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Film güncellendi!");
                setIsEditDialogOpen(false);
                setEditingItem(null);
                fetchWishlist();
            } else {
                const error = await response.json();
                toast.error(error.error || "Film güncellenemedi");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSeries = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== "series") return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            userSeriesId: editingItem.id,
            seriesId: editingItem.originalData.series.id,
            title: formData.get("title") as string,
            creator: formData.get("creator") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            totalSeasons: parseInt(formData.get("totalSeasons") as string),
            status: editStatus,
        };

        try {
            const response = await fetch("/api/series", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Dizi güncellendi!");
                setIsEditDialogOpen(false);
                setEditingItem(null);
                fetchWishlist();
            } else {
                const error = await response.json();
                toast.error(error.error || "Dizi güncellenemedi");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
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
        <AnimatedPage className="space-y-6">
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
                        onEdit={handleEdit}
                        emptyMessage="İstek listeniz boş"
                    />
                </TabsContent>
            </Tabs>

            {/* Book Edit Dialog */}
            <Dialog open={isEditDialogOpen && editingItem?.type === "book"} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Kitabı Düzenle</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Kitap bilgilerini güncelleyin
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && editingItem.type === "book" && (
                        <form onSubmit={handleEditBook} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-title" className="text-gray-300">Kitap Adı *</Label>
                                <Input id="edit-book-title" name="title" required defaultValue={editingItem.title} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-author" className="text-gray-300">Yazar *</Label>
                                <Input id="edit-book-author" name="author" required defaultValue={editingItem.subtitle} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-cover" className="text-gray-300">Kapak Görseli URL</Label>
                                <Input id="edit-book-cover" name="coverImage" type="url" defaultValue={editingItem.coverImage || ""} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-genre" className="text-gray-300">Tür</Label>
                                <Input id="edit-book-genre" name="genre" defaultValue={editingItem.genre || ""} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Durum</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                                        {statusOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10 focus:bg-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`h-4 w-4 ${option.color}`} />
                                                        <span>{option.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Güncelleniyor...</> : "Güncelle"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Movie Edit Dialog */}
            <Dialog open={isEditDialogOpen && editingItem?.type === "movie"} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Filmi Düzenle</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Film bilgilerini güncelleyin
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && editingItem.type === "movie" && (
                        <form onSubmit={handleEditMovie} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-title" className="text-gray-300">Film Adı *</Label>
                                <Input id="edit-movie-title" name="title" required defaultValue={editingItem.title} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-director" className="text-gray-300">Yönetmen</Label>
                                <Input id="edit-movie-director" name="director" defaultValue={editingItem.subtitle} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-cover" className="text-gray-300">Kapak Görseli URL</Label>
                                <Input id="edit-movie-cover" name="coverImage" type="url" defaultValue={editingItem.coverImage || ""} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-genre" className="text-gray-300">Tür</Label>
                                <Input id="edit-movie-genre" name="genre" defaultValue={editingItem.genre || ""} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Durum</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                                        {statusOptions.slice(0, 3).map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10 focus:bg-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`h-4 w-4 ${option.color}`} />
                                                        <span>{option.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Güncelleniyor...</> : "Güncelle"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Series Edit Dialog */}
            <Dialog open={isEditDialogOpen && editingItem?.type === "series"} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Diziyi Düzenle</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Dizi bilgilerini güncelleyin
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && editingItem.type === "series" && (
                        <form onSubmit={handleEditSeries} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-series-title" className="text-gray-300">Dizi Adı *</Label>
                                <Input id="edit-series-title" name="title" required defaultValue={editingItem.title} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-series-creator" className="text-gray-300">Yapımcı</Label>
                                <Input id="edit-series-creator" name="creator" defaultValue={editingItem.subtitle} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-series-cover" className="text-gray-300">Kapak Görseli URL</Label>
                                <Input id="edit-series-cover" name="coverImage" type="url" defaultValue={editingItem.coverImage || ""} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-series-genre" className="text-gray-300">Tür</Label>
                                    <Input id="edit-series-genre" name="genre" defaultValue={editingItem.genre || ""} className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-series-seasons" className="text-gray-300">Sezon Sayısı</Label>
                                    <Input id="edit-series-seasons" name="totalSeasons" type="number" min="1" defaultValue={editingItem.originalData.series.totalSeasons} className="bg-white/5 border-white/10 text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Durum</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                                        {statusOptions.slice(0, 3).map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10 focus:bg-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`h-4 w-4 ${option.color}`} />
                                                        <span>{option.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Güncelleniyor...</> : "Güncelle"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AnimatedPage>
    );
}
