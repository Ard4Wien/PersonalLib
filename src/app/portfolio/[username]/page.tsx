import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Check, Film, Tv } from "lucide-react";

interface PortfolioPageProps {
    params: Promise<{ username: string }>;
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
                take: 12,
            },
            movies: {
                where: { status: "COMPLETED" },
                include: { movie: true },
                orderBy: { updatedAt: "desc" },
                take: 12,
            },
            series: {
                where: { overallStatus: "COMPLETED" },
                include: { series: true },
                orderBy: { updatedAt: "desc" },
                take: 12,
            },
        },
    });

    if (!user) {
        notFound();
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const totalBooks = user.books.length;
    const totalMovies = user.movies.length;
    const totalSeries = user.series.length;
    const totalContent = totalBooks + totalMovies + totalSeries;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-zinc-950 dark:to-black transition-colors duration-300">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-purple-500/50">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
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

                {/* Books Section */}
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
                                {user.books.map((userBook) => (
                                    <div
                                        key={userBook.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        {userBook.book.coverImage ? (
                                            <img
                                                src={userBook.book.coverImage}
                                                alt={userBook.book.title}
                                                className="w-full h-full object-cover"
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
                                        <Badge className="absolute top-2 right-2 bg-green-500/80 text-white">
                                            <Check className="h-3 w-3" />
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
                                {user.movies.map((userMovie) => (
                                    <div
                                        key={userMovie.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        {userMovie.movie.coverImage ? (
                                            <img
                                                src={userMovie.movie.coverImage}
                                                alt={userMovie.movie.title}
                                                className="w-full h-full object-cover"
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
                                        <Badge className="absolute top-2 right-2 bg-green-500/80 text-white">
                                            <Check className="h-3 w-3" />
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
                                {user.series.map((userSeries) => (
                                    <div
                                        key={userSeries.id}
                                        className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
                                    >
                                        {userSeries.series.coverImage ? (
                                            <img
                                                src={userSeries.series.coverImage}
                                                alt={userSeries.series.title}
                                                className="w-full h-full object-cover"
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
                                        <Badge className="absolute top-2 right-2 bg-green-500/80 text-white">
                                            <Check className="h-3 w-3" />
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

                {/* Footer */}
                <div className="text-center mt-12 text-gray-500 text-sm">
                    PersonalLib ile oluşturuldu 📚🎬
                </div>
            </div>
        </div>
    );
}
