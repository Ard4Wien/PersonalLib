"use client";

import { useEffect, useState } from "react";
import { MediaGrid, DeleteConfirmDialog } from "@/components/media";
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
import { useSearch } from "@/contexts/search-context";
import { useTranslation } from "@/contexts/language-context";
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

const getStatusOptions = (t: any) => [
    { value: "WISHLIST", label: t.status.wishlist, icon: Heart, color: "text-purple-400" },
    { value: "WATCHING", label: t.status.watching, icon: Clock, color: "text-blue-400" },
    { value: "READING", label: t.status.reading, icon: Clock, color: "text-blue-400" },
    { value: "COMPLETED", label: t.status.completed, icon: Check, color: "text-green-400" },
    { value: "DROPPED", label: t.status.dropped, icon: X, color: "text-red-400" },
];

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [isSubmitting, setIsSubmitting] = useState(false);


    const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editStatus, setEditStatus] = useState("WISHLIST");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "book" | "movie" | "series" } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { searchQuery } = useSearch();
    const { t } = useTranslation();

    const statusOptions = getStatusOptions(t);

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
                            href: "#",
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
                            href: "#",
                            status: "WISHLIST",
                            originalData: m,
                        });
                    });
            }

            if (seriesRes.ok) {
                const series = await seriesRes.json();
                series
                    .filter((s: { status: string }) => s.status === "WISHLIST")
                    .forEach((s: any) => {
                        wishlistItems.push({
                            id: s.id,
                            type: "series",
                            title: s.series.title,
                            subtitle: s.series.creator,
                            coverImage: s.series.coverImage,
                            genre: s.series.genre,
                            href: "#",
                            status: "WISHLIST",
                            originalData: s,
                        });
                    });
            }

            setItems(wishlistItems);
        } catch {
            console.error("Wishlist loading error");
            toast.error(t.wishlist.loadError);
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
                toast.success(t.books.updateSuccess);
                setIsEditDialogOpen(false);
                setEditingItem(null);
                fetchWishlist();
            } else {
                const error = await response.json();
                toast.error(error.error || t.books.updateFailed);
            }
        } catch {
            toast.error(t.common.error);
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
                toast.success(t.movies.movieUpdateSuccess);
                setIsEditDialogOpen(false);
                setEditingItem(null);
                fetchWishlist();
            } else {
                const error = await response.json();
                toast.error(error.error || t.movies.movieUpdateFailed);
            }
        } catch {
            toast.error(t.common.error);
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
                toast.success(t.movies.seriesUpdateSuccess);
                setIsEditDialogOpen(false);
                setEditingItem(null);
                fetchWishlist();
            } else {
                const error = await response.json();
                toast.error(error.error || t.movies.seriesUpdateFailed);
            }
        } catch {
            toast.error(t.common.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        const item = items.find((i) => i.id === id);
        if (item) {
            setItemToDelete({ id, type: item.type });
            setIsDeleteDialogOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const endpoint = itemToDelete.type === "book" ? "books" : itemToDelete.type === "movie" ? "movies" : "series";
            const response = await fetch(`/api/${endpoint}?id=${itemToDelete.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
                const message = itemToDelete.type === "book" ? t.wishlist.bookRemoved :
                              itemToDelete.type === "movie" ? t.wishlist.movieRemoved :
                              t.wishlist.seriesRemoved;
                toast.success(message);
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        } catch {
            toast.error(t.common.error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredItems = items.filter((item) => {

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                item.title.toLowerCase().includes(query) ||
                item.subtitle.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }


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
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 shrink-0">
                    <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground line-clamp-1">{t.wishlist.title}</h1>
                    <p className="text-muted-foreground text-xs md:text-sm">
                        {t.wishlist.itemsWaiting.replace("{count}", items.length.toString())}
                    </p>
                </div>
            </div>

            {/* Tabs & Controls */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <TabsList className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-full sm:w-auto justify-start overflow-x-auto">
                        <TabsTrigger value="all" className="flex-1 sm:flex-none data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs md:text-sm text-muted-foreground hover:text-foreground">
                            {t.wishlist.allTab} ({items.length})
                        </TabsTrigger>
                        <TabsTrigger value="books" className="flex-1 sm:flex-none data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs md:text-sm text-muted-foreground hover:text-foreground">
                            <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            {t.wishlist.booksTab}
                        </TabsTrigger>
                        <TabsTrigger value="movies" className="flex-1 sm:flex-none data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm text-muted-foreground hover:text-foreground">
                            <Film className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            {t.wishlist.moviesSeriesTab}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-6">
                    <MediaGrid
                        items={filteredItems}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        emptyMessage={t.wishlist.emptyWishlist}
                    />
                </TabsContent>
            </Tabs>

            {/* Book Edit Dialog */}
            <Dialog open={isEditDialogOpen && editingItem?.type === "book"} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground dark:text-white">{t.wishlist.editBook}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t.wishlist.editBookDescription}
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && editingItem.type === "book" && (
                        <form onSubmit={handleEditBook} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-title" className="text-muted-foreground">{t.books.bookName}</Label>
                                <Input id="edit-book-title" name="title" required defaultValue={editingItem.title} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-author" className="text-muted-foreground">{t.books.author}</Label>
                                <Input id="edit-book-author" name="author" required defaultValue={editingItem.subtitle} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-cover" className="text-muted-foreground">{t.books.coverImageUrl}</Label>
                                <Input id="edit-book-cover" name="coverImage" type="url" defaultValue={editingItem.coverImage || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-book-genre" className="text-muted-foreground">{t.books.genre}</Label>
                                <Input id="edit-book-genre" name="genre" defaultValue={editingItem.genre || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t.books.status}</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                        {statusOptions.filter(o => o.value !== "WATCHING").map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem key={option.value} value={option.value} className="text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10">
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
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.common.updating}</> : t.common.update}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Movie Edit Dialog */}
            <Dialog open={isEditDialogOpen && editingItem?.type === "movie"} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground dark:text-white">{t.wishlist.editMovie}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t.wishlist.editMovieDescription}
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && editingItem.type === "movie" && (
                        <form onSubmit={handleEditMovie} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-title" className="text-muted-foreground">{t.movies.movieName}</Label>
                                <Input id="edit-movie-title" name="title" required defaultValue={editingItem.title} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-director" className="text-muted-foreground">{t.movies.director}</Label>
                                <Input id="edit-movie-director" name="director" defaultValue={editingItem.subtitle} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-cover" className="text-muted-foreground">{t.books.coverImageUrl}</Label>
                                <Input id="edit-movie-cover" name="coverImage" type="url" defaultValue={editingItem.coverImage || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-movie-genre" className="text-muted-foreground">{t.books.genre}</Label>
                                <Input id="edit-movie-genre" name="genre" defaultValue={editingItem.genre || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t.books.status}</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                        {statusOptions.filter(o => o.value !== "READING" && o.value !== "DROPPED").map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem key={option.value} value={option.value} className="text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10">
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
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.common.updating}</> : t.common.update}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Series Edit Dialog */}
            <Dialog open={isEditDialogOpen && editingItem?.type === "series"} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground dark:text-white">{t.wishlist.editSeries}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t.wishlist.editSeriesDescription}
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && editingItem.type === "series" && (
                        <form onSubmit={handleEditSeries} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-series-title" className="text-muted-foreground">{t.movies.seriesName}</Label>
                                <Input id="edit-series-title" name="title" required defaultValue={editingItem.title} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-series-creator" className="text-muted-foreground">{t.movies.creator}</Label>
                                <Input id="edit-series-creator" name="creator" defaultValue={editingItem.subtitle} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-series-cover" className="text-muted-foreground">{t.books.coverImageUrl}</Label>
                                <Input id="edit-series-cover" name="coverImage" type="url" defaultValue={editingItem.coverImage || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-series-genre" className="text-muted-foreground">{t.books.genre}</Label>
                                    <Input id="edit-series-genre" name="genre" defaultValue={editingItem.genre || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-series-seasons" className="text-muted-foreground">{t.movies.totalSeasons}</Label>
                                    <Input id="edit-series-seasons" name="totalSeasons" type="number" min="1" defaultValue={editingItem.originalData.series.totalSeasons} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t.books.status}</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                        {statusOptions.filter(o => o.value !== "READING").map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem key={option.value} value={option.value} className="text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10">
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
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.common.updating}</> : t.common.update}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title={itemToDelete?.type === "book" ? t.wishlist.removeBook : itemToDelete?.type === "movie" ? t.wishlist.removeMovie : t.wishlist.removeSeries}
                description={itemToDelete?.type === "book" ? t.wishlist.removeBookDescription : itemToDelete?.type === "movie" ? t.wishlist.removeMovieDescription : t.wishlist.removeSeriesDescription}
                isLoading={isDeleting}
            />
        </AnimatedPage>
    );
}
