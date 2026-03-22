import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { usernameSchema } from "@/lib/validations";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username: rawUsername } = await params;

        // Rate Limiting (Public endpoint bot koruması)
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        // Merkezi şema ile kullanıcı adı doğrulaması
        const validated = usernameSchema.safeParse(rawUsername);
        if (!validated.success) {
            return NextResponse.json({ error: "Geçersiz kullanıcı adı" }, { status: 400 });
        }

        const username = validated.data;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                username: true,
                displayName: true,
                isPrivate: true,
                books: {
                    where: {
                        status: { in: ["READING", "COMPLETED"] }
                    },
                    include: { book: true },
                    orderBy: { updatedAt: "desc" },
                    take: 40 // En güncel 40 içerik
                },
                movies: {
                    where: {
                        status: { in: ["WATCHING", "COMPLETED"] }
                    },
                    include: { movie: true },
                    orderBy: { updatedAt: "desc" },
                    take: 40 // En güncel 40 içerik
                },
                series: {
                    where: {
                        overallStatus: { in: ["WATCHING", "COMPLETED"] }
                    },
                    include: { series: true },
                    orderBy: { updatedAt: "desc" },
                    take: 40 // En güncel 40 içerik
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


        const standardizedData = {
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
                    mediaId: ub.bookId,
                    title: ub.book.title,
                    subtitle: ub.book.author || "Bilinmeyen Yazar",
                    image: ub.book.coverImage,
                    status: ub.status,
                    isFavorite: ub.isFavorite,
                    updatedAt: ub.updatedAt.toISOString()
                })),
                movies: user.movies.map(um => ({
                    mediaId: um.movieId,
                    title: um.movie.title,
                    subtitle: um.movie.director || "Bilinmeyen Yönetmen",
                    image: um.movie.coverImage,
                    status: um.status,
                    isFavorite: um.isFavorite,
                    updatedAt: um.updatedAt.toISOString()
                })),
                series: user.series.map(us => ({
                    mediaId: us.seriesId,
                    title: us.series.title,
                    subtitle: us.series.creator || "Bilinmeyen Yapımcı",
                    image: us.series.coverImage,
                    status: us.overallStatus,
                    isFavorite: us.isFavorite,
                    updatedAt: us.updatedAt.toISOString()
                }))
            }
        };

        return NextResponse.json(standardizedData);
    } catch (error) {
        // Sessiz hata yönetimi
        return NextResponse.json({ error: "Veriler alınırken bir hata oluştu" }, { status: 500 });
    }
}
