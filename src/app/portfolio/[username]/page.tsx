import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Check, Clock, Film, Star, Tv, Lock, User } from "lucide-react";
import { getInitials, BACKGROUND_GRADIENT, getOptimizedImageUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { ClientImage } from "@/components/media/client-image";
import { getPublicUrl } from "@/lib/supabase";


interface PortfolioPageProps {
    params: Promise<{ username: string }>;
}

interface UserContent {
    id: string;
    isFavorite: boolean;
    updatedAt: Date | string;
    book?: any;
    movie?: any;
    series?: any;
    type?: 'book' | 'movie' | 'series';
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
    const { username } = await params;

    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
            isPrivate: true,
            socialLinks: true,

            books: {
                where: { status: { in: ["READING", "COMPLETED"] } },
                include: { book: true },
                orderBy: { updatedAt: "desc" },
            },
            movies: {
                where: { status: { in: ["WATCHING", "COMPLETED"] } },
                include: { movie: true },
                orderBy: { updatedAt: "desc" },
            },
            series: {
                where: { overallStatus: { in: ["WATCHING", "COMPLETED"] } },
                include: { series: true },
                orderBy: { updatedAt: "desc" },
            },
        },
    }) as any;

    if (!user) {
        notFound();
    }

    if (user.isPrivate) {
        return (
            <div className={BACKGROUND_GRADIENT}>
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <BackButton />
                </div>
                <div className="container mx-auto px-4 flex flex-col items-center justify-center flex-1 text-center">
                    <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-xl max-w-md w-full">
                        <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Bu Profil Gizlidir</h1>
                        <p className="text-muted-foreground">
                            Bu kullanıcı profilini gizli tutmayı tercih etti.
                        </p>
                        <Link href="/">
                            <Button className="mt-8 w-full bg-gradient-to-r from-purple-600 to-pink-600">
                                Ana Sayfaya Dön
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }


    const books = user.books as any[];
    const movies = user.movies as any[];
    const series = user.series as any[];

    const completedBooks = books.filter(b => b.status === "COMPLETED").length;
    const completedMovies = movies.filter(m => m.status === "COMPLETED").length;
    const completedSeries = series.filter(s => s.overallStatus === "COMPLETED").length;
    const totalCompleted = completedBooks + completedMovies + completedSeries;

    const allFavorites = [
        ...books.filter(b => b.isFavorite).map(b => ({ ...b, type: 'book' as const })),
        ...movies.filter(m => m.isFavorite).map(m => ({ ...m, type: 'movie' as const })),
        ...series.filter(s => s.isFavorite).map(s => ({ ...s, type: 'series' as const }))
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Sosyal ağ ikonlarını filtrele
    const socialPlatformMap: Record<string, { url: string; hoverColor: string; icon: React.ReactNode }> = {
        instagram: { url: "https://instagram.com/", hoverColor: "hover:text-[#dc2743]", icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> },
        x: { url: "https://x.com/", hoverColor: "hover:text-black dark:hover:text-white", icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
        youtube: { url: "https://youtube.com/@", hoverColor: "hover:text-[#FF0000]", icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
        github: { url: "https://github.com/", hoverColor: "hover:text-black dark:hover:text-white", icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> },
        linkedin: { url: "https://linkedin.com/in/", hoverColor: "hover:text-[#0077b5]", icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
        tiktok: { url: "https://tiktok.com/@", hoverColor: "hover:text-black dark:hover:text-white", icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
    };

    const visibleSocials: { platform: string; username: string; url: string; hoverColor: string; icon: React.ReactNode }[] = [];
    if (user.socialLinks && typeof user.socialLinks === "object") {
        for (const [key, val] of Object.entries(user.socialLinks as Record<string, any>)) {
            const username = val?.u || val?.username;
            const isVisible = (val?.v === 1) || (val?.isVisible === true);
            if (isVisible && username && socialPlatformMap[key]) {
                const p = socialPlatformMap[key];
                visibleSocials.push({ platform: key, username: username, url: p.url + username, hoverColor: p.hoverColor, icon: p.icon });
            }
        }
    }

    return (
        <div className={BACKGROUND_GRADIENT}>
            <div className="container mx-auto px-4 pt-8 max-w-4xl">
                <BackButton />
            </div>
            <div className="container mx-auto px-4 py-12 max-w-4xl flex-1">
                {/* Header */}
                <div className="text-center mb-12">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-purple-500/30">
                        {user.image && <AvatarImage src={getPublicUrl(user.image) || ""} alt={user.displayName} />}
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl">
                            {user.displayName ? getInitials(user.displayName) : <User className="h-10 w-10" />}
                        </AvatarFallback>
                    </Avatar>
                    <h1 className="text-3xl font-bold text-foreground">{user.displayName}</h1>
                    <p className="text-muted-foreground mt-1">@{user.username}</p>

                    {/* Social Links */}
                    {visibleSocials.length > 0 && (
                        <div className="flex justify-center gap-6 mt-8">
                            {visibleSocials.map(s => (
                                <a
                                    key={s.platform}
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={s.platform}
                                    className={`text-zinc-500 dark:text-zinc-400 ${s.hoverColor} transition-all duration-300 hover:scale-125 flex items-center justify-center`}
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">{totalCompleted}</div>
                            <div className="text-sm text-muted-foreground">Tamamlanan</div>
                        </div>
                        <Separator orientation="vertical" className="h-12 bg-black/5 dark:bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{completedBooks}</div>
                            <div className="text-sm text-muted-foreground">Kitap</div>
                        </div>
                        <Separator orientation="vertical" className="h-12 bg-black/5 dark:bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completedMovies}</div>
                            <div className="text-sm text-muted-foreground">Film</div>
                        </div>
                        <Separator orientation="vertical" className="h-12 bg-black/5 dark:bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{completedSeries}</div>
                            <div className="text-sm text-muted-foreground">Dizi</div>
                        </div>
                    </div>
                </div>

                {/* Favorites Section */}
                {allFavorites.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-wider">Favoriler</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {allFavorites.map((item: any) => {
                                const data = item.book || item.movie || item.series;
                                return (
                                    <div key={item.id} className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-yellow-500/50 transition-all duration-300 shadow-md hover:shadow-yellow-500/10">
                                        <ClientImage
                                            src={getOptimizedImageUrl(data.coverImage, 400)}
                                            alt={data.title}
                                            fill
                                            unoptimized={true}
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            fallbackText={data.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 flex flex-col justify-end p-4">
                                            <p className="text-white font-bold text-sm md:text-base line-clamp-2 leading-tight mb-1">{data.title}</p>
                                            <p className="text-zinc-300 text-xs italic line-clamp-1">{data.author || data.director || data.creator}</p>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg border border-yellow-200/50">
                                            <Star className="h-3 w-3 fill-current" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Separator className="mt-12 bg-black/5 dark:bg-white/5" />
                    </div>
                )}
                {books.length > 0 && (
                    <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 mb-8 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                                Okunan & Okunmakta Olan Kitaplar
                                <Badge variant="secondary" className="ml-auto bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    {books.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {books.map((userBook) => (
                                    <div
                                        key={userBook.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        <ClientImage
                                            src={getOptimizedImageUrl(userBook.book.coverImage, 400)}
                                            alt={userBook.book.title}
                                            fill
                                            unoptimized={true}
                                            className="object-cover"
                                            fallbackText={userBook.book.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white font-medium text-sm line-clamp-2">
                                                {userBook.book.title}
                                            </p>
                                            <p className="text-gray-400 text-xs italic">
                                                {userBook.book.author}
                                            </p>
                                        </div>
                                        <Badge className={`absolute top-2 right-2 ${userBook.isFavorite ? 'bg-yellow-400 text-black' : userBook.status === 'READING' ? 'bg-blue-500/90 text-white' : 'bg-green-500/80 text-white'}`}>
                                            {userBook.isFavorite ? <Star className="h-3 w-3 fill-current" /> : userBook.status === 'READING' ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Movies Section */}
                {movies.length > 0 && (
                    <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 mb-8 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Film className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                İzlenen & İzlenmekte Olan Filmler
                                <Badge variant="secondary" className="ml-auto bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    {movies.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {movies.map((userMovie) => (
                                    <div
                                        key={userMovie.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        <ClientImage
                                            src={getOptimizedImageUrl(userMovie.movie.coverImage, 400)}
                                            alt={userMovie.movie.title}
                                            fill
                                            unoptimized={true}
                                            className="object-cover"
                                            fallbackText={userMovie.movie.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white font-medium text-sm line-clamp-2">
                                                {userMovie.movie.title}
                                            </p>
                                            <p className="text-gray-400 text-xs italic">
                                                {userMovie.movie.director}
                                            </p>
                                        </div>
                                        <Badge className={`absolute top-2 right-2 ${userMovie.isFavorite ? 'bg-yellow-400 text-black' : userMovie.status === 'WATCHING' ? 'bg-blue-500/90 text-white' : 'bg-green-500/80 text-white'}`}>
                                            {userMovie.isFavorite ? <Star className="h-3 w-3 fill-current" /> : userMovie.status === 'WATCHING' ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Series Section */}
                {series.length > 0 && (
                    <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Tv className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                                İzlenen & İzlenmekte Olan Diziler
                                <Badge variant="secondary" className="ml-auto bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                    {series.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {series.map((userSeries) => (
                                    <div
                                        key={userSeries.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        <ClientImage
                                            src={getOptimizedImageUrl(userSeries.series.coverImage, 400)}
                                            alt={userSeries.series.title}
                                            fill
                                            unoptimized={true}
                                            className="object-cover"
                                            fallbackText={userSeries.series.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white font-medium text-sm line-clamp-2">
                                                {userSeries.series.title}
                                            </p>
                                            <p className="text-gray-400 text-xs italic">
                                                {userSeries.series.creator}
                                            </p>
                                        </div>
                                        <Badge className={`absolute top-2 right-2 ${userSeries.isFavorite ? 'bg-yellow-400 text-black' : userSeries.overallStatus === 'WATCHING' ? 'bg-blue-500/90 text-white' : 'bg-green-500/80 text-white'}`}>
                                            {userSeries.isFavorite ? <Star className="h-3 w-3 fill-current" /> : userSeries.overallStatus === 'WATCHING' ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {(books.length + movies.length + series.length) === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-muted-foreground text-lg">
                            Henüz tamamlanan içerik yok
                        </p>
                    </div>
                )}
            </div>
            <footer className="text-center py-8 text-muted-foreground text-sm">
                PersonalLib ile oluşturuldu 📚🎬
            </footer>
        </div>
    );
}
