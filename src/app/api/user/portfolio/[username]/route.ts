import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                displayName: true,
                isPrivate: true,
                books: {
                    where: {
                        status: { in: ["READING", "COMPLETED"] }
                    },
                    include: { book: true },
                    orderBy: { updatedAt: "desc" }
                },
                movies: {
                    where: {
                        status: { in: ["WATCHING", "COMPLETED"] }
                    },
                    include: { movie: true },
                    orderBy: { updatedAt: "desc" }
                },
                series: {
                    where: {
                        overallStatus: { in: ["WATCHING", "COMPLETED"] }
                    },
                    include: { series: true },
                    orderBy: { updatedAt: "desc" }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
        }

        if (user.isPrivate) {
            return NextResponse.json({
                isPrivate: true,
                displayName: user.displayName,
                username: user.username,
                message: "Bu profil gizlidir"
            });
        }

        // Standardize data for mobile (flat structure)
        const standardizedData = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            isPrivate: false,
            stats: {
                books: user.books.length,
                movies: user.movies.length,
                series: user.series.length,
                total: user.books.length + user.movies.length + user.series.length
            },
            collections: {
                books: user.books.map(ub => ({
                    id: ub.id,
                    mediaId: ub.bookId,
                    title: ub.book.title,
                    subtitle: ub.book.author || "Bilinmeyen Yazar",
                    image: ub.book.coverImage,
                    status: ub.status,
                    rating: ub.rating,
                    isFavorite: ub.isFavorite,
                    updatedAt: ub.updatedAt.toISOString()
                })),
                movies: user.movies.map(um => ({
                    id: um.id,
                    mediaId: um.movieId,
                    title: um.movie.title,
                    subtitle: um.movie.director || "Bilinmeyen Yönetmen",
                    image: um.movie.coverImage,
                    status: um.status,
                    rating: um.rating,
                    isFavorite: um.isFavorite,
                    updatedAt: um.updatedAt.toISOString()
                })),
                series: user.series.map(us => ({
                    id: us.id,
                    mediaId: us.seriesId,
                    title: us.series.title,
                    subtitle: us.series.creator || "Bilinmeyen Yapımcı",
                    image: us.series.coverImage,
                    status: us.overallStatus,
                    rating: us.rating,
                    isFavorite: us.isFavorite,
                    updatedAt: us.updatedAt.toISOString()
                }))
            }
        };

        return NextResponse.json(standardizedData);
    } catch (error) {
        console.error("Portfolyo API hatası:", error);
        return NextResponse.json({ error: "Veriler alınırken bir hata oluştu" }, { status: 500 });
    }
}
