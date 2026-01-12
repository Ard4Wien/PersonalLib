"use client";

import { useEffect, useState } from "react";
import { MediaGrid } from "@/components/media";
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
import { Check, Clapperboard, Clock, Film, Heart, Loader2, Plus, Tv, X } from "lucide-react";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";

interface UserMovie {
    id: string;
    status: string;
    movie: {
        id: string;
        title: string;
        director: string;
        coverImage: string | null;
        genre: string | null;
    };
}

interface UserSeries {
    id: string;
    overallStatus: string;
    series: {
        id: string;
        title: string;
        creator: string;
        coverImage: string | null;
        genre: string | null;
        totalSeasons: number;
    };
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
    const [activeTab, setActiveTab] = useState("movies");
    const [statusFilter, setStatusFilter] = useState("all");
    const [movieStatus, setMovieStatus] = useState("WISHLIST");
    const [seriesStatus, setSeriesStatus] = useState("WISHLIST");

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
            title: formData.get("title") as string,
            director: formData.get("director") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
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
                toast.error(error.error || "Film eklenemedi");
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
            title: formData.get("title") as string,
            creator: formData.get("creator") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            totalSeasons: parseInt(formData.get("totalSeasons") as string) || 1,
            status: seriesStatus,
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
                toast.success("Dizi başarıyla eklendi!");
            } else {
                const error = await response.json();
                toast.error(error.error || "Dizi eklenemedi");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
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
            const response = await fetch("/api/series", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userSeriesId, status }),
            });

            if (response.ok) {
                setSeries((prev) =>
                    prev.map((s) =>
                        s.id === userSeriesId ? { ...s, overallStatus: status } : s
                    )
                );
                toast.success("Durum güncellendi");
            }
        } catch {
            toast.error("Durum güncellenemedi");
        }
    };

    const handleMovieDelete = async (userMovieId: string) => {
        try {
            const response = await fetch(`/api/movies?id=${userMovieId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setMovies((prev) => prev.filter((m) => m.id !== userMovieId));
                toast.success("Film kaldırıldı");
            }
        } catch {
            toast.error("Film kaldırılamadı");
        }
    };

    const handleSeriesDelete = async (userSeriesId: string) => {
        try {
            const response = await fetch(`/api/series?id=${userSeriesId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setSeries((prev) => prev.filter((s) => s.id !== userSeriesId));
                toast.success("Dizi kaldırıldı");
            }
        } catch {
            toast.error("Dizi kaldırılamadı");
        }
    };

    const filteredMovies = movies.filter((m) => {
        if (statusFilter === "all") return true;
        return m.status === statusFilter;
    });

    const filteredSeries = series.filter((s) => {
        if (statusFilter === "all") return true;
        return s.overallStatus === statusFilter;
    });

    const movieItems = filteredMovies.map((m) => ({
        id: m.id,
        title: m.movie.title,
        subtitle: m.movie.director,
        coverImage: m.movie.coverImage,
        type: "movie" as const,
        status: m.status,
        genre: m.movie.genre,
        href: `/movies/${m.movie.id}`,
    }));

    const seriesItems = filteredSeries.map((s) => ({
        id: s.id,
        title: s.series.title,
        subtitle: `${s.series.creator} • ${s.series.totalSeasons} Sezon`,
        coverImage: s.series.coverImage,
        type: "series" as const,
        status: s.overallStatus,
        genre: s.series.genre,
        href: `/series/${s.series.id}`,
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Film className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Filmler & Diziler</h1>
                        <p className="text-gray-400 text-sm">
                            {movies.length} film, {series.length} dizi
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Film Ekle Dialog */}
                    <Dialog open={isMovieDialogOpen} onOpenChange={setIsMovieDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                                <Clapperboard className="h-4 w-4 mr-2" />
                                Film Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                            <DialogHeader>
                                <DialogTitle className="text-white">Yeni Film Ekle</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Kütüphanenize yeni bir film ekleyin
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddMovie} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="movie-title" className="text-gray-300">Film Adı *</Label>
                                    <Input id="movie-title" name="title" required placeholder="Örn: Inception" className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="movie-director" className="text-gray-300">Yönetmen *</Label>
                                    <Input id="movie-director" name="director" required placeholder="Örn: Christopher Nolan" className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="movie-cover" className="text-gray-300">Kapak Görseli URL</Label>
                                    <Input id="movie-cover" name="coverImage" type="url" placeholder="https://..." className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="movie-genre" className="text-gray-300">Tür</Label>
                                    <Input id="movie-genre" name="genre" placeholder="Örn: Bilim Kurgu" className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Durum</Label>
                                    <Select value={movieStatus} onValueChange={setMovieStatus}>
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
                                        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ekleniyor...</> : "Ekle"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Dizi Ekle Dialog */}
                    <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                                <Tv className="h-4 w-4 mr-2" />
                                Dizi Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                            <DialogHeader>
                                <DialogTitle className="text-white">Yeni Dizi Ekle</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Kütüphanenize yeni bir dizi ekleyin
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddSeries} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="series-title" className="text-gray-300">Dizi Adı *</Label>
                                    <Input id="series-title" name="title" required placeholder="Örn: Breaking Bad" className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="series-creator" className="text-gray-300">Yapımcı *</Label>
                                    <Input id="series-creator" name="creator" required placeholder="Örn: Vince Gilligan" className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="series-cover" className="text-gray-300">Kapak Görseli URL</Label>
                                    <Input id="series-cover" name="coverImage" type="url" placeholder="https://..." className="bg-white/5 border-white/10 text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="series-genre" className="text-gray-300">Tür</Label>
                                        <Input id="series-genre" name="genre" placeholder="Örn: Dram" className="bg-white/5 border-white/10 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="series-seasons" className="text-gray-300">Sezon Sayısı</Label>
                                        <Input id="series-seasons" name="totalSeasons" type="number" min="1" defaultValue="1" className="bg-white/5 border-white/10 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Durum</Label>
                                    <Select value={seriesStatus} onValueChange={setSeriesStatus}>
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
                                        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ekleniyor...</> : "Ekle"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="movies" className="data-[state=active]:bg-blue-600 text-gray-300 data-[state=active]:text-white hover:text-white">
                            <Clapperboard className="h-4 w-4 mr-2" />
                            Filmler ({movies.length})
                        </TabsTrigger>
                        <TabsTrigger value="series" className="data-[state=active]:bg-purple-600 text-gray-300 data-[state=active]:text-white hover:text-white">
                            <Tv className="h-4 w-4 mr-2" />
                            Diziler ({series.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
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

                <TabsContent value="movies" className="mt-6">
                    <MediaGrid
                        items={movieItems}
                        onStatusChange={handleMovieStatusChange}
                        onDelete={handleMovieDelete}
                        emptyMessage="Henüz film eklenmemiş"
                    />
                </TabsContent>

                <TabsContent value="series" className="mt-6">
                    <MediaGrid
                        items={seriesItems}
                        onStatusChange={handleSeriesStatusChange}
                        onDelete={handleSeriesDelete}
                        emptyMessage="Henüz dizi eklenmemiş"
                    />
                </TabsContent>
            </Tabs>
        </AnimatedPage>
    );
}
