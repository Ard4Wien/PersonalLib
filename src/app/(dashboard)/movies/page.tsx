"use client";

import { useEffect, useState } from "react";
import { MediaGrid, MediaSearch, DeleteConfirmDialog } from "@/components/media";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Clapperboard, Clock, Film, Heart, Loader2, Plus, Star, Tv, X } from "lucide-react";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";
import { useSearch } from "@/contexts/search-context";

interface UserMovie {
    id: string;
    mediaId: string;
    title: string;
    subtitle: string;
    image: string | null;
    coverImage?: string | null;
    type: "movie";
    status: string;
    isFavorite: boolean;
    genre?: string | null;
    updatedAt: string;
    movie?: {
        id: string;
        title: string;
        director: string;
        coverImage: string | null;
        genre: string | null;
    };
}

interface UserSeries {
    id: string;
    mediaId: string;
    title: string;
    subtitle: string;
    image: string | null;
    coverImage?: string | null;
    type: "series";
    status: string;
    overallStatus: string; // Compatibility
    isFavorite: boolean;
    genre?: string | null;
    updatedAt: string;
    series?: {
        id: string;
        title: string;
        creator: string;
        coverImage: string | null;
        genre: string | null;
        totalSeasons: number;
    };
    lastSeason: number | null;
    lastEpisode: number | null;
}

const statusOptions = [
    { value: "WISHLIST", label: "İstek Listesi", icon: Heart, color: "text-purple-400" },
    { value: "WATCHING", label: "İzleniyor", icon: Clock, color: "text-blue-400" },
    { value: "COMPLETED", label: "İzlendi", icon: Check, color: "text-green-400" },
    { value: "DROPPED", label: "Bırakıldı", icon: X, color: "text-red-400" },
];

const filterOptions = [
    { value: "all", label: "Tüm Durumlar", icon: Film, color: "text-gray-400" },
    ...statusOptions,
];

export default function MoviesPage() {
    const [movies, setMovies] = useState<UserMovie[]>([]);
    const [series, setSeries] = useState<UserSeries[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
    const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [movieStatus, setMovieStatus] = useState("WISHLIST");
    const [seriesStatus, setSeriesStatus] = useState("WISHLIST");
    const [seriesSeason, setSeriesSeason] = useState("1");
    const [seriesEpisode, setSeriesEpisode] = useState("1");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "movie" | "series" } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit states
    const [isMovieEditDialogOpen, setIsMovieEditDialogOpen] = useState(false);
    const [isSeriesEditDialogOpen, setIsSeriesEditDialogOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<UserMovie | null>(null);
    const [editingSeries, setEditingSeries] = useState<UserSeries | null>(null);
    const [editMovieStatus, setEditMovieStatus] = useState("WISHLIST");
    const [editSeriesStatus, setEditSeriesStatus] = useState("WISHLIST");
    const [editSeriesSeason, setEditSeriesSeason] = useState("1");
    const [editSeriesEpisode, setEditSeriesEpisode] = useState("1");
    const { searchQuery } = useSearch();

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const [moviesRes, seriesRes] = await Promise.all([
                fetch("/api/movies"),
                fetch("/api/series"),
            ]);

            if (moviesRes.ok) {
                const moviesData = await moviesRes.json();
                setMovies(moviesData);
            }
            if (seriesRes.ok) {
                const seriesData = await seriesRes.json();
                setSeries(seriesData);
            }
        } catch (error) {
            console.error("İçerik yüklenemedi:", error);
            toast.error("İçerik yüklenirken bir hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMovie = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: (formData.get("title") as string) || undefined,
            director: (formData.get("director") as string) || undefined,
            coverImage: (formData.get("coverImage") as string) || undefined,
            genre: (formData.get("genre") as string) || undefined,
            imdbId: (formData.get("imdbId") as string) || undefined,
            status: movieStatus,
        };

        try {
            const response = await fetch("/api/movies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newMovie = await response.json();
                setMovies((prev) => [newMovie, ...prev]);
                setIsMovieDialogOpen(false);
                setMovieStatus("WISHLIST");
                toast.success("Film başarıyla eklendi!");
            } else {
                const error = await response.json();
                const errorMessage = typeof error.error === 'string'
                    ? error.error
                    : typeof error.error === 'object'
                        ? Object.values(error.error).flat().join(', ')
                        : "Film eklenemedi";
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddSeries = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: (formData.get("title") as string) || undefined,
            creator: (formData.get("creator") as string) || undefined,
            coverImage: (formData.get("coverImage") as string) || undefined,
            genre: (formData.get("genre") as string) || undefined,
            totalSeasons: parseInt(formData.get("totalSeasons") as string) || 1,
            status: seriesStatus,
            lastSeason: (seriesStatus === "WATCHING" || seriesStatus === "DROPPED") ? seriesSeason : undefined,
            lastEpisode: (seriesStatus === "WATCHING" || seriesStatus === "DROPPED") ? seriesEpisode : undefined,
        };

        try {
            const response = await fetch("/api/series", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newSeries = await response.json();
                setSeries((prev) => [newSeries, ...prev]);
                setIsSeriesDialogOpen(false);
                setSeriesStatus("WISHLIST");
                setSeriesSeason("1");
                setSeriesEpisode("1");
                toast.success("Dizi başarıyla eklendi!");
            } else {
                const error = await response.json();
                const errorMessage = typeof error.error === 'string'
                    ? error.error
                    : typeof error.error === 'object'
                        ? Object.values(error.error).flat().join(', ')
                        : "Dizi eklenemedi";
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditMovie = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingMovie) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            userMovieId: editingMovie.id,
            movieId: editingMovie.mediaId || editingMovie.movie?.id,
            title: formData.get("title") as string,
            director: formData.get("director") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            status: editMovieStatus,
        };

        try {
            const response = await fetch("/api/movies", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updatedMovie = await response.json();
                setMovies((prev) =>
                    prev.map((m) => (m.id === editingMovie.id ? updatedMovie : m))
                );
                setIsMovieEditDialogOpen(false);
                setEditingMovie(null);
                toast.success("Film güncellendi!");
            } else {
                const error = await response.json();
                const errorMessage = typeof error.error === 'string'
                    ? error.error
                    : typeof error.error === 'object'
                        ? Object.values(error.error).flat().join(', ')
                        : "Film güncellenemedi";
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSeries = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingSeries) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            userSeriesId: editingSeries.id,
            seriesId: editingSeries.mediaId || editingSeries.series?.id,
            title: formData.get("title") as string,
            creator: formData.get("creator") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            totalSeasons: parseInt(formData.get("totalSeasons") as string),
            status: editSeriesStatus,
            lastSeason: (editSeriesStatus === "WATCHING" || editSeriesStatus === "DROPPED") ? editSeriesSeason : undefined,
            lastEpisode: (editSeriesStatus === "WATCHING" || editSeriesStatus === "DROPPED") ? editSeriesEpisode : undefined,
        };

        try {
            const response = await fetch("/api/series", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updatedSeries = await response.json();
                setSeries((prev) =>
                    prev.map((s) => (s.id === editingSeries.id ? updatedSeries : s))
                );
                setIsSeriesEditDialogOpen(false);
                setEditingSeries(null);
                toast.success("Dizi güncellendi!");
            } else {
                const error = await response.json();
                const errorMessage = typeof error.error === 'string'
                    ? error.error
                    : typeof error.error === 'object'
                        ? Object.values(error.error).flat().join(', ')
                        : "Dizi güncellenemedi";
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMovieFavoriteToggle = async (userMovieId: string) => {
        const movie = movies.find((m) => m.id === userMovieId);
        if (!movie) return;
        const newFavoriteStatus = !movie.isFavorite;
        try {
            const response = await fetch("/api/movies", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userMovieId, isFavorite: newFavoriteStatus }),
            });
            if (response.ok) {
                setMovies((prev) =>
                    prev.map((m) => (m.id === userMovieId ? { ...m, isFavorite: newFavoriteStatus } : m))
                );
                toast.success(newFavoriteStatus ? "Favorilere eklendi" : "Favorilerden çıkarıldı", {
                    icon: <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
                });
            }
        } catch {
            toast.error("İşlem başarısız oldu");
        }
    };

    const handleSeriesFavoriteToggle = async (userSeriesId: string) => {
        const s = series.find((s) => s.id === userSeriesId);
        if (!s) return;
        const newFavoriteStatus = !s.isFavorite;
        try {
            const response = await fetch("/api/series", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userSeriesId, isFavorite: newFavoriteStatus }),
            });
            if (response.ok) {
                setSeries((prev) =>
                    prev.map((s) => (s.id === userSeriesId ? { ...s, isFavorite: newFavoriteStatus } : s))
                );
                toast.success(newFavoriteStatus ? "Favorilere eklendi" : "Favorilerden çıkarıldı", {
                    icon: <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
                });
            }
        } catch {
            toast.error("İşlem başarısız oldu");
        }
    };

    const handleMovieStatusChange = async (userMovieId: string, status: string) => {
        try {
            const response = await fetch("/api/movies", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userMovieId, status }),
            });

            if (response.ok) {
                setMovies((prev) =>
                    prev.map((m) => (m.id === userMovieId ? { ...m, status } : m))
                );
                toast.success("Durum güncellendi");
            }
        } catch {
            toast.error("Durum güncellenemedi");
        }
    };

    const handleSeriesStatusChange = async (userSeriesId: string, status: string) => {
        try {
            const currentItem = series.find(s => s.id === userSeriesId);
            const response = await fetch("/api/series", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userSeriesId,
                    status,
                    lastSeason: currentItem?.lastSeason,
                    lastEpisode: currentItem?.lastEpisode
                }),
            });

            if (response.ok) {
                const updatedData = await response.json();
                setSeries((prev) =>
                    prev.map((s) =>
                        s.id === userSeriesId ? updatedData : s
                    )
                );
                toast.success("Durum güncellendi");
            }
        } catch {
            toast.error("Durum güncellenemedi");
        }
    };

    const handleEdit = (id: string) => {
        const movie = movies.find((m) => m.id === id);
        if (movie) {
            setEditingMovie(movie);
            setEditMovieStatus(movie.status);
            setIsMovieEditDialogOpen(true);
            return;
        }
        const s = series.find((s) => s.id === id);
        if (s) {
            setEditingSeries(s);
            setEditSeriesStatus(s.overallStatus);
            setEditSeriesSeason(s.lastSeason?.toString() || "1");
            setEditSeriesEpisode(s.lastEpisode?.toString() || "1");
            setIsSeriesEditDialogOpen(true);
        }
    };

    const handleMovieDelete = (userMovieId: string) => {
        setItemToDelete({ id: userMovieId, type: "movie" });
        setIsDeleteDialogOpen(true);
    };

    const handleSeriesDelete = (userSeriesId: string) => {
        setItemToDelete({ id: userSeriesId, type: "series" });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const endpoint = itemToDelete.type === "movie" ? "movies" : "series";
            const response = await fetch(`/api/${endpoint}?id=${itemToDelete.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                if (itemToDelete.type === "movie") {
                    setMovies((prev) => prev.filter((m) => m.id !== itemToDelete.id));
                    toast.success("Film kaldırıldı");
                } else {
                    setSeries((prev) => prev.filter((s) => s.id !== itemToDelete.id));
                    toast.success("Dizi kaldırıldı");
                }
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        } catch {
            toast.error(`${itemToDelete.type === "movie" ? "Film" : "Dizi"} kaldırılamadı`);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredMovies = movies.filter((m) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                m.title.toLowerCase().includes(query) ||
                m.subtitle.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }
        if (statusFilter === "all") return true;
        return m.status === statusFilter;
    }).sort((a, b) => {
        if (a.isFavorite === b.isFavorite) {
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        return a.isFavorite ? -1 : 1;
    });

    const filteredSeries = series.filter((s) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                s.title.toLowerCase().includes(query) ||
                s.subtitle.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }
        if (statusFilter === "all") return true;
        return (s.status || s.overallStatus) === statusFilter;
    }).sort((a, b) => {
        if (a.isFavorite === b.isFavorite) {
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        return a.isFavorite ? -1 : 1;
    });

    const movieItems = filteredMovies.map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.subtitle,
        coverImage: m.image || m.coverImage,
        type: "movie" as const,
        status: m.status,
        isFavorite: m.isFavorite,
        genre: m.genre || m.movie?.genre,
        href: `#`,
    }));

    const seriesItems = filteredSeries.map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        coverImage: s.image || s.coverImage,
        type: "series" as const,
        status: s.status || s.overallStatus,
        isFavorite: s.isFavorite,
        genre: s.genre || s.series?.genre,
        href: `#`,
        lastSeason: s.lastSeason,
        lastEpisode: s.lastEpisode,
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <AnimatedPage className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shrink-0">
                        <Film className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground line-clamp-1">Filmler & Diziler</h1>
                        <p className="text-muted-foreground text-xs md:text-sm">
                            {movies.length} film, {series.length} dizi
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Film Ekle Dialog */}
                    <Dialog open={isMovieDialogOpen} onOpenChange={setIsMovieDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs md:text-sm px-3 md:px-4">
                                <Clapperboard className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                                Film Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-foreground dark:text-white">Yeni Film Ekle</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Kütüphanenize eklemek için yeni bir film arayın veya manuel olarak ekleyin.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2 border-b border-white/5 mb-4">
                                <MediaSearch
                                    type="movie"
                                    onSelect={(item: any) => {
                                        const form = document.getElementById("add-movie-form") as HTMLFormElement;
                                        if (form) {
                                            (form.elements.namedItem("title") as HTMLInputElement).value = item.title || "";
                                            (form.elements.namedItem("director") as HTMLInputElement).value = item.director || "";
                                            (form.elements.namedItem("coverImage") as HTMLInputElement).value = item.coverImage || "";
                                            (form.elements.namedItem("genre") as HTMLInputElement).value = item.genre || "";
                                        }
                                        toast.success("Bilgiler dolduruldu!");
                                    }}
                                />
                            </div>

                            <form id="add-movie-form" onSubmit={handleAddMovie} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="movie-title" className="text-muted-foreground">Film Adı *</Label>
                                        <Input id="movie-title" name="title" required placeholder="Örn: Inception" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="movie-director" className="text-muted-foreground">Yönetmen *</Label>
                                        <Input id="movie-director" name="director" required placeholder="Örn: Christopher Nolan" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="movie-cover" className="text-muted-foreground">Kapak Görseli URL</Label>
                                    <Input id="movie-cover" name="coverImage" type="url" placeholder="https://..." className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="movie-genre" className="text-muted-foreground">Tür</Label>
                                    <Input id="movie-genre" name="genre" placeholder="Örn: Bilim Kurgu" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Durum</Label>
                                    <Select value={movieStatus} onValueChange={setMovieStatus}>
                                        <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                            {statusOptions.slice(0, 3).map((option) => {
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
                                        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ekleniyor...</> : "Ekle"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Dizi Ekle Dialog */}
                    <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs md:text-sm px-3 md:px-4">
                                <Tv className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                                Dizi Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-foreground dark:text-white">Yeni Dizi Ekle</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Kütüphanenize eklemek için yeni bir dizi arayın veya manuel olarak ekleyin.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2 border-b border-white/5 mb-4">
                                <MediaSearch
                                    type="series"
                                    onSelect={(item: any) => {
                                        const form = document.getElementById("add-series-form") as HTMLFormElement;
                                        if (form) {
                                            (form.elements.namedItem("title") as HTMLInputElement).value = item.title || "";
                                            (form.elements.namedItem("creator") as HTMLInputElement).value = item.creator || "";
                                            (form.elements.namedItem("coverImage") as HTMLInputElement).value = item.coverImage || "";
                                            (form.elements.namedItem("genre") as HTMLInputElement).value = item.genre || "";
                                            (form.elements.namedItem("totalSeasons") as HTMLInputElement).value = item.totalSeasons?.toString() || "1";
                                        }
                                        toast.success("Bilgiler dolduruldu!");
                                    }}
                                />
                            </div>

                            <form id="add-series-form" onSubmit={handleAddSeries} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="series-title" className="text-muted-foreground">Dizi Adı *</Label>
                                        <Input id="series-title" name="title" required placeholder="Örn: Breaking Bad" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="series-creator" className="text-muted-foreground">Yapımcı *</Label>
                                        <Input id="series-creator" name="creator" required placeholder="Örn: Vince Gilligan" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="series-cover" className="text-muted-foreground">Kapak Görseli URL</Label>
                                    <Input id="series-cover" name="coverImage" type="url" placeholder="https://..." className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="series-genre" className="text-muted-foreground">Tür</Label>
                                        <Input id="series-genre" name="genre" placeholder="Örn: Dram" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="series-seasons" className="text-muted-foreground">Sezon Sayısı</Label>
                                        <Input id="series-seasons" name="totalSeasons" type="number" min="1" defaultValue="1" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Durum</Label>
                                    <Select value={seriesStatus} onValueChange={setSeriesStatus}>
                                        <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                            {statusOptions.slice(0, 3).map((option) => {
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

                                {(seriesStatus === "WATCHING" || seriesStatus === "DROPPED") && (
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="series-last-season" className="text-muted-foreground">Kaldığım Sezon</Label>
                                            <Input
                                                id="series-last-season"
                                                type="number"
                                                min="1"
                                                value={seriesSeason}
                                                onChange={(e) => setSeriesSeason(e.target.value)}
                                                className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="series-last-episode" className="text-muted-foreground">Kaldığım Bölüm</Label>
                                            <Input
                                                id="series-last-episode"
                                                type="number"
                                                min="1"
                                                value={seriesEpisode}
                                                onChange={(e) => setSeriesEpisode(e.target.value)}
                                                className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ekleniyor...</> : "Ekle"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Film Düzenle Dialog */}
                    <Dialog open={isMovieEditDialogOpen} onOpenChange={(open) => { setIsMovieEditDialogOpen(open); if (!open) setEditingMovie(null); }}>
                        <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-foreground dark:text-white">Filmi Düzenle</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Seçili filmin bilgilerini ve izleme durumunu güncelleyin.
                                </DialogDescription>
                            </DialogHeader>
                            {editingMovie && (
                                <form onSubmit={handleEditMovie} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-movie-title" className="text-muted-foreground">Film Adı *</Label>
                                        <Input id="edit-movie-title" name="title" required defaultValue={editingMovie.title} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-movie-director" className="text-muted-foreground">Yönetmen</Label>
                                        <Input id="edit-movie-director" name="director" defaultValue={editingMovie.subtitle} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-movie-cover" className="text-muted-foreground">Kapak Görseli URL</Label>
                                        <Input id="edit-movie-cover" name="coverImage" type="url" defaultValue={editingMovie.image || editingMovie.coverImage || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-movie-genre" className="text-muted-foreground">Tür</Label>
                                        <Input id="edit-movie-genre" name="genre" defaultValue={editingMovie.genre || editingMovie.movie?.genre || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Durum</Label>
                                        <Select value={editMovieStatus} onValueChange={setEditMovieStatus}>
                                            <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                                {statusOptions.slice(0, 3).map((option) => {
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
                                            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Güncelleniyor...</> : "Güncelle"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Dizi Düzenle Dialog */}
                    <Dialog open={isSeriesEditDialogOpen} onOpenChange={(open) => { setIsSeriesEditDialogOpen(open); if (!open) setEditingSeries(null); }}>
                        <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                            <DialogHeader>
                                <DialogTitle className="text-white">Diziyi Düzenle</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Seçili dizinin bilgilerini ve izleme durumunu güncelleyin.
                                </DialogDescription>
                            </DialogHeader>
                            {editingSeries && (
                                <form onSubmit={handleEditSeries} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-series-title" className="text-gray-300">Dizi Adı *</Label>
                                        <Input id="edit-series-title" name="title" required defaultValue={editingSeries.title} className="bg-white/5 border-white/10 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-series-creator" className="text-gray-300">Yapımcı</Label>
                                        <Input id="edit-series-creator" name="creator" defaultValue={editingSeries.subtitle} className="bg-white/5 border-white/10 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-series-cover" className="text-gray-300">Kapak Görseli URL</Label>
                                        <Input id="edit-series-cover" name="coverImage" type="url" defaultValue={editingSeries.image || editingSeries.coverImage || ""} className="bg-white/5 border-white/10 text-white" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-series-genre" className="text-gray-300">Tür</Label>
                                            <Input id="edit-series-genre" name="genre" defaultValue={editingSeries.genre || editingSeries.series?.genre || ""} className="bg-white/5 border-white/10 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-series-seasons" className="text-gray-300">Sezon Sayısı</Label>
                                            <Input id="edit-series-seasons" name="totalSeasons" type="number" min="1" defaultValue={editingSeries.series?.totalSeasons || 1} className="bg-white/5 border-white/10 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Durum</Label>
                                        <Select value={editSeriesStatus} onValueChange={setEditSeriesStatus}>
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

                                    {(editSeriesStatus === "WATCHING" || editSeriesStatus === "DROPPED") && (
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-series-last-season" className="text-gray-300">Kaldığım Sezon</Label>
                                                <Input
                                                    id="edit-series-last-season"
                                                    type="number"
                                                    min="1"
                                                    value={editSeriesSeason}
                                                    onChange={(e) => setEditSeriesSeason(e.target.value)}
                                                    className="bg-white/5 border-white/10 text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-series-last-episode" className="text-gray-300">Kaldığım Bölüm</Label>
                                                <Input
                                                    id="edit-series-last-episode"
                                                    type="number"
                                                    min="1"
                                                    value={editSeriesEpisode}
                                                    onChange={(e) => setEditSeriesEpisode(e.target.value)}
                                                    className="bg-white/5 border-white/10 text-white"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Güncelleniyor...</> : "Güncelle"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <TabsList className="bg-white/5 border border-white/10 w-full md:w-auto justify-start overflow-x-auto">
                        <TabsTrigger value="all" className="flex-1 md:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 text-xs md:text-sm text-gray-300 data-[state=active]:text-white hover:text-white">
                            <Film className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Tümü ({movies.length + series.length})
                        </TabsTrigger>
                        <TabsTrigger value="movies" className="flex-1 md:flex-none data-[state=active]:bg-blue-600 text-xs md:text-sm text-gray-300 data-[state=active]:text-white hover:text-white">
                            <Clapperboard className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Filmler
                        </TabsTrigger>
                        <TabsTrigger value="series" className="flex-1 md:flex-none data-[state=active]:bg-purple-600 text-xs md:text-sm text-gray-300 data-[state=active]:text-white hover:text-white">
                            <Tv className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Diziler
                        </TabsTrigger>
                    </TabsList>

                    {/* Status Filter */}
                    <div className="hidden md:block">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                                {filterOptions.map((option) => {
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
                </div>

                <TabsContent value="all" className="mt-6">
                    <MediaGrid
                        items={[...movieItems, ...seriesItems].sort((a, b) => {
                            if (a.isFavorite === b.isFavorite) return 0;
                            return a.isFavorite ? -1 : 1;
                        })}
                        onStatusChange={(id, status) => {
                            const isMovie = movieItems.some(m => m.id === id);
                            if (isMovie) {
                                handleMovieStatusChange(id, status);
                            } else {
                                handleSeriesStatusChange(id, status);
                            }
                        }}
                        onFavoriteToggle={(id) => {
                            const isMovie = movieItems.some(m => m.id === id);
                            if (isMovie) {
                                handleMovieFavoriteToggle(id);
                            } else {
                                handleSeriesFavoriteToggle(id);
                            }
                        }}
                        onEdit={handleEdit}
                        onDelete={(id) => {
                            const isMovie = movieItems.some(m => m.id === id);
                            if (isMovie) {
                                handleMovieDelete(id);
                            } else {
                                handleSeriesDelete(id);
                            }
                        }}
                        emptyMessage="Henüz içerik eklenmemiş"
                    />
                </TabsContent>

                <TabsContent value="movies" className="mt-6">
                    <MediaGrid
                        items={movieItems}
                        onStatusChange={handleMovieStatusChange}
                        onFavoriteToggle={handleMovieFavoriteToggle}
                        onEdit={handleEdit}
                        onDelete={handleMovieDelete}
                        emptyMessage="Henüz film eklenmemiş"
                    />
                </TabsContent>

                <TabsContent value="series" className="mt-6">
                    <MediaGrid
                        items={seriesItems}
                        onStatusChange={handleSeriesStatusChange}
                        onFavoriteToggle={handleSeriesFavoriteToggle}
                        onEdit={handleEdit}
                        onDelete={handleSeriesDelete}
                        emptyMessage="Henüz dizi eklenmemiş"
                    />
                </TabsContent>
            </Tabs>

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title={`${itemToDelete?.type === "movie" ? "Filmi" : "Diziyi"} Kaldır`}
                description={`Bu ${itemToDelete?.type === "movie" ? "filmi" : "diziyi"} kütüphanenizden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                isLoading={isDeleting}
            />
        </AnimatedPage>
    );
}

