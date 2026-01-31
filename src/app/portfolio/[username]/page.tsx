import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Check, Film, Star, Tv } from "lucide-react";
import { getInitials, BACKGROUND_GRADIENT, getOptimizedImageUrl } from "@/lib/utils";
import Image from "next/image";

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
        include: {
            books: {
                where: { status: "COMPLETED" },
                include: { book: true },
                orderBy: { updatedAt: "desc" },
            },
            movies: {
                where: { status: "COMPLETED" },
                include: { movie: true },
                orderBy: { updatedAt: "desc" },
            },
            series: {
                where: { overallStatus: "COMPLETED" },
                include: { series: true },
                orderBy: { updatedAt: "desc" },
            },
        },
    }) as any;

    if (!user) {
        notFound();
    }


    const books = user.books as any[];
    const movies = user.movies as any[];
    const series = user.series as any[];

    const totalBooks = books.length;
    const totalMovies = movies.length;
    const totalSeries = series.length;
    const totalContent = totalBooks + totalMovies + totalSeries;

    const allFavorites = [
        ...books.filter(b => b.isFavorite).map(b => ({ ...b, type: 'book' as const })),
        ...movies.filter(m => m.isFavorite).map(m => ({ ...m, type: 'movie' as const })),
        ...series.filter(s => s.isFavorite).map(s => ({ ...s, type: 'series' as const }))
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return (
        <div className={BACKGROUND_GRADIENT}>
            <div className="container mx-auto px-4 py-12 max-w-4xl flex-1">
                {/* Header */}
                <div className="text-center mb-12">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-purple-500/50">
                        <AvatarImage src="/default-avatar.png" alt={user.displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl">
                            {getInitials(user.displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <h1 className="text-3xl font-bold text-white">{user.displayName}</h1>
                    <p className="text-gray-400">@{user.username}</p>

                    {/* Stats */}
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{totalContent}</div>
                            <div className="text-sm text-gray-400">Tamamlanan</div>
                        </div>
                        <Separator orientation="vertical" className="h-12 bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{totalBooks}</div>
                            <div className="text-sm text-gray-400">Kitap</div>
                        </div>
                        <Separator orientation="vertical" className="h-12 bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{totalMovies}</div>
                            <div className="text-sm text-gray-400">Film</div>
                        </div>
                        <Separator orientation="vertical" className="h-12 bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{totalSeries}</div>
                            <div className="text-sm text-gray-400">Dizi</div>
                        </div>
                    </div>
                </div>

                {/* Favorites Section */}
                {allFavorites.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Favoriler</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {allFavorites.map((item: any) => {
                                const data = item.book || item.movie || item.series;
                                return (
                                    <div key={item.id} className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 shadow-lg hover:shadow-yellow-500/10">
                                        {data.coverImage ? (
                                            <Image src={getOptimizedImageUrl(data.coverImage, 400)} alt={data.title} fill unoptimized={true} className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                {item.type === 'book' ? '📚' : item.type === 'movie' ? '🎬' : '📺'}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 flex flex-col justify-end p-4">
                                            <p className="text-white font-bold text-sm md:text-base line-clamp-2 leading-tight mb-1">{data.title}</p>
                                            <p className="text-gray-400 text-xs italic line-clamp-1">{data.author || data.director || data.creator}</p>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg border border-yellow-200/50">
                                            <Star className="h-3 w-3 fill-current" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Separator className="mt-12 bg-white/5" />
                    </div>
                )}
                {totalBooks > 0 && (
                    <Card className="bg-white/5 border-white/10 mb-8">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-purple-400" />
                                Okunan Kitaplar
                                <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-400">
                                    {totalBooks}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {books.slice(0, 12).map((userBook) => (
                                    <div
                                        key={userBook.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        {userBook.book.coverImage ? (
                                            <Image
                                                src={getOptimizedImageUrl(userBook.book.coverImage, 400)}
                                                alt={userBook.book.title}
                                                fill
                                                unoptimized={true}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                📚
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white font-medium text-sm line-clamp-2">
                                                {userBook.book.title}
                                            </p>
                                            <p className="text-gray-400 text-xs italic">
                                                {userBook.book.author}
                                            </p>
                                        </div>
                                        <Badge className={`absolute top-2 right-2 ${userBook.isFavorite ? 'bg-yellow-400 text-black' : 'bg-green-500/80 text-white'}`}>
                                            {userBook.isFavorite ? <Star className="h-3 w-3 fill-current" /> : <Check className="h-3 w-3" />}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Movies Section */}
                {totalMovies > 0 && (
                    <Card className="bg-white/5 border-white/10 mb-8">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Film className="h-5 w-5 text-blue-400" />
                                İzlenen Filmler
                                <Badge variant="secondary" className="ml-auto bg-blue-500/20 text-blue-400">
                                    {totalMovies}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {movies.slice(0, 12).map((userMovie) => (
                                    <div
                                        key={userMovie.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        {userMovie.movie.coverImage ? (
                                            <Image
                                                src={getOptimizedImageUrl(userMovie.movie.coverImage, 400)}
                                                alt={userMovie.movie.title}
                                                fill
                                                unoptimized={true}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                🎬
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white font-medium text-sm line-clamp-2">
                                                {userMovie.movie.title}
                                            </p>
                                            <p className="text-gray-400 text-xs italic">
                                                {userMovie.movie.director}
                                            </p>
                                        </div>
                                        <Badge className={`absolute top-2 right-2 ${userMovie.isFavorite ? 'bg-yellow-400 text-black' : 'bg-green-500/80 text-white'}`}>
                                            {userMovie.isFavorite ? <Star className="h-3 w-3 fill-current" /> : <Check className="h-3 w-3" />}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Series Section */}
                {totalSeries > 0 && (
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Tv className="h-5 w-5 text-cyan-400" />
                                İzlenen Diziler
                                <Badge variant="secondary" className="ml-auto bg-cyan-500/20 text-cyan-400">
                                    {totalSeries}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {series.slice(0, 12).map((userSeries) => (
                                    <div
                                        key={userSeries.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        {userSeries.series.coverImage ? (
                                            <Image
                                                src={getOptimizedImageUrl(userSeries.series.coverImage, 400)}
                                                alt={userSeries.series.title}
                                                fill
                                                unoptimized={true}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                📺
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white font-medium text-sm line-clamp-2">
                                                {userSeries.series.title}
                                            </p>
                                            <p className="text-gray-400 text-xs italic">
                                                {userSeries.series.creator}
                                            </p>
                                        </div>
                                        <Badge className={`absolute top-2 right-2 ${userSeries.isFavorite ? 'bg-yellow-400 text-black' : 'bg-green-500/80 text-white'}`}>
                                            {userSeries.isFavorite ? <Star className="h-3 w-3 fill-current" /> : <Check className="h-3 w-3" />}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {totalContent === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-400 text-lg">
                            Henüz tamamlanan içerik yok
                        </p>
                    </div>
                )}
            </div>
            <footer className="text-center py-8 text-gray-400 text-sm">
                PersonalLib ile oluşturuldu 📚🎬
            </footer>
        </div>
    );
}
