import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Check, Clock, Film, Star, Tv, Lock, User, ArrowLeft } from "lucide-react";
import { getInitials, BACKGROUND_GRADIENT, getOptimizedImageUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { ClientImage } from "@/components/media/client-image";
import { getPublicUrl } from "@/lib/supabase";
import { SOCIAL_PLATFORMS, PLATFORM_ORDER, PLATFORM_MAP } from "@/lib/social-platforms";
import { translations, Locale } from "@/lib/translations";


interface PortfolioPageProps {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PortfolioPageProps) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { displayName: true, language: true }
    });

    if (!user) {
        return {
            title: "Profil Bulunamadı | PersonalLib",
        };
    }

    const t = translations[user.language as Locale] || translations.tr;

    return {
        title: t.portfolio.viewPortfolio.replace("{name}", user.displayName).replace("{username}", username),
        description: t.portfolio.viewPortfolioDescription.replace("{name}", user.displayName),
    };
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
            language: true,
            isPrivate: true,
            socialLinks: true,

            books: {
                where: { status: { in: ["READING", "COMPLETED"] } },
                include: { book: true },
                orderBy: { updatedAt: "desc" },
                take: 40,
            },
            movies: {
                where: { status: { in: ["WATCHING", "COMPLETED"] } },
                include: { movie: true },
                orderBy: { updatedAt: "desc" },
                take: 40,
            },
            series: {
                where: { overallStatus: { in: ["WATCHING", "COMPLETED"] } },
                include: { series: true },
                orderBy: { updatedAt: "desc" },
                take: 40,
            },
        },
    }) as any;

    if (!user) {
        notFound();
    }

    const t = translations[user.language as Locale] || translations.tr;

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
                        <h1 className="text-2xl font-bold text-foreground mb-2">{t.portfolio.privateProfileTitle}</h1>
                        <p className="text-muted-foreground">
                            {t.portfolio.privateProfileDesc}
                        </p>
                        <Link href="/">
                            <Button className="mt-8 w-full bg-gradient-to-r from-purple-600 to-pink-600">
                                {t.common.backToHome}
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

    // Sosyal ağ ikonları merkezi yapıdan alınıyor
    const visibleSocials: { platform: string; username: string; url: string; hoverColor: string; icon: React.ReactNode }[] = [];
    if (user.socialLinks && typeof user.socialLinks === "object") {
        PLATFORM_ORDER.forEach(platformKey => {
            const data = (user.socialLinks as Record<string, any>)[platformKey];
            if (data) {
                const username = data?.u || data?.username;
                const isVisible = (data?.v === 1) || (data?.isVisible === true);
                const platformMeta = PLATFORM_MAP[platformKey];
                
                if (isVisible && username && platformMeta) {
                    visibleSocials.push({ 
                        platform: platformKey, 
                        username: username, 
                        url: platformMeta.baseUrl + username, 
                        hoverColor: platformMeta.hoverColor, 
                        icon: platformMeta.icon 
                    });
                }
            }
        });
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
                                    className={`h-9 w-9 text-muted-foreground transition-all duration-300 flex items-center justify-center shrink-0 ${s.hoverColor}`}
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Stats - Minimalist Reverted Design */}
                    <div className="flex justify-center flex-wrap gap-x-8 gap-y-4 mt-8 px-4">
                        <div className="text-center group cursor-default">
                            <div className="text-2xl md:text-3xl font-black text-foreground tabular-nums group-hover:scale-110 transition-transform duration-300">{totalCompleted}</div>
                            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-0.5">{t.status.completed}</div>
                        </div>
                        <Separator orientation="vertical" className="hidden sm:block h-10 bg-black/5 dark:bg-white/10 self-center" />
                        <div className="text-center group cursor-default">
                            <div className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400 tabular-nums group-hover:scale-110 transition-transform duration-300">{completedBooks}</div>
                            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-0.5">{t.profile.booksCount}</div>
                        </div>
                        <Separator orientation="vertical" className="hidden sm:block h-10 bg-black/5 dark:bg-white/10 self-center" />
                        <div className="text-center group cursor-default">
                            <div className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums group-hover:scale-110 transition-transform duration-300">{completedMovies}</div>
                            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-0.5">{t.profile.moviesCount}</div>
                        </div>
                        <Separator orientation="vertical" className="hidden sm:block h-10 bg-black/10 dark:bg-white/10 self-center" />
                        <div className="text-center group cursor-default">
                            <div className="text-2xl md:text-3xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums group-hover:scale-110 transition-transform duration-300">{completedSeries}</div>
                            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-0.5">{t.profile.seriesCount}</div>
                        </div>
                    </div>
                </div>

                {/* Favorites Section */}
                {allFavorites.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-wider">{t.common.favorites}</h2>
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
                    <Card id="books-section" className="scroll-mt-24 bg-white dark:bg-white/5 border-black/5 dark:border-white/10 mb-8 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                                {t.portfolio.readingBooks}
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
                    <Card id="movies-section" className="scroll-mt-24 bg-white dark:bg-white/5 border-black/5 dark:border-white/10 mb-8 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Film className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                {t.portfolio.watchingMovies}
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
                    <Card id="series-section" className="scroll-mt-24 bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Tv className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                                {t.portfolio.watchingSeries}
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
                            {t.media.emptyState}
                        </p>
                    </div>
                )}
            </div>
            <footer className="text-center py-8 text-muted-foreground text-sm">
                {t.portfolio.footer}
            </footer>
        </div>
    );
}
