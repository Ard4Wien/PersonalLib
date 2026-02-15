import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { seriesSchema, seriesUpdateSchema, mediaStatusSchema, ratingSchema, notesSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const userSeries = await prisma.userSeries.findMany({
            where: { userId },
            include: {
                series: {
                    include: { seasons: true },
                },
                seasonStatuses: {
                    include: { season: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        });


        const standardizedSeries = userSeries.map((us) => ({
            id: us.id,
            mediaId: us.seriesId,
            title: us.series.title,
            subtitle: us.series.creator || "Bilinmeyen Yapımcı",
            image: us.series.coverImage,
            coverImage: us.series.coverImage,
            type: "series",
            status: us.overallStatus,
            rating: us.rating,
            isFavorite: us.isFavorite,
            updatedAt: us.updatedAt.toISOString(),

            series: us.series,
            seasonStatuses: us.seasonStatuses
        }));

        return NextResponse.json(standardizedSeries);
    } catch (error) {
        console.error("Dizi listesi hatası:", error);
        return NextResponse.json(
            { error: "Diziler yüklenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}


export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }


        const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const rateLimitResult = checkRateLimit(clientIP);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: rateLimitResult.message },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { status = "WISHLIST", lastSeason, lastEpisode, seasons = [], ...seriesData } = body;

        const validatedFields = seriesSchema.safeParse(seriesData);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }


        let series = await prisma.series.findFirst({
            where: {
                OR: [
                    { title: validatedFields.data.title, creator: validatedFields.data.creator },
                    ...(validatedFields.data.imdbId ? [{ imdbId: validatedFields.data.imdbId }] : []),
                ],
            },
        });

        if (!series) {
            series = await prisma.series.create({
                data: {
                    title: validatedFields.data.title,
                    totalSeasons: validatedFields.data.totalSeasons,
                    ...(validatedFields.data.creator && { creator: validatedFields.data.creator }),
                    ...(validatedFields.data.coverImage && { coverImage: validatedFields.data.coverImage }),
                    ...(validatedFields.data.description && { description: validatedFields.data.description }),
                    ...(validatedFields.data.startYear && { startYear: validatedFields.data.startYear }),
                    ...(validatedFields.data.endYear && { endYear: validatedFields.data.endYear }),
                    ...(validatedFields.data.genre && { genre: validatedFields.data.genre }),
                    ...(validatedFields.data.imdbId && { imdbId: validatedFields.data.imdbId }),
                    seasons: {
                        create: Array.from({ length: validatedFields.data.totalSeasons }, (_, i) => ({
                            seasonNumber: i + 1,
                        })),
                    },
                } as any,
                include: { seasons: true },
            });
        }


        const existingUserSeries = await prisma.userSeries.findUnique({
            where: {
                userId_seriesId: {
                    userId,
                    seriesId: series.id,
                },
            },
        });

        if (existingUserSeries) {
            return NextResponse.json(
                { error: "Bu dizi zaten kütüphanenizde" },
                { status: 400 }
            );
        }


        const userSeries = await prisma.userSeries.create({
            data: {
                userId,
                seriesId: series.id,
                overallStatus: status,
                ...(status === "WATCHING" || status === "DROPPED" ? {
                    lastSeason: lastSeason ? parseInt(lastSeason) : 1,
                    lastEpisode: lastEpisode ? parseInt(lastEpisode) : 1,
                } : {
                    lastSeason: null,
                    lastEpisode: null,
                }),
            },
            include: {
                series: { include: { seasons: true } },
                seasonStatuses: true,
            },
        });


        const standardizedResponse = {
            id: userSeries.id,
            mediaId: userSeries.seriesId,
            title: userSeries.series.title,
            subtitle: `${userSeries.series.creator} • ${userSeries.series.totalSeasons} Sezon`,
            image: userSeries.series.coverImage,
            coverImage: userSeries.series.coverImage,
            type: "series",
            status: userSeries.overallStatus,
            rating: userSeries.rating,
            isFavorite: userSeries.isFavorite,
            genre: userSeries.series.genre,
            updatedAt: userSeries.updatedAt.toISOString(),
            series: userSeries.series,
            seasonStatuses: userSeries.seasonStatuses
        };

        return NextResponse.json(standardizedResponse, { status: 201 });
    } catch (error) {
        console.error("Dizi ekleme hatası:", error);
        return NextResponse.json(
            { error: "Dizi eklenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}


export async function PUT(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();

        const validatedFields = seriesUpdateSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { userSeriesId, seriesId, title, creator, coverImage, genre, totalSeasons, status, lastSeason, lastEpisode } = validatedFields.data;

        const existingUserSeries = await prisma.userSeries.findUnique({
            where: { id: userSeriesId, userId },
            select: { seriesId: true }
        });

        if (!existingUserSeries) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
        }

        if (existingUserSeries.seriesId !== seriesId) {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }

        const parsedTotalSeasons = totalSeasons ? Number(totalSeasons) : undefined;
        if (parsedTotalSeasons !== undefined && (isNaN(parsedTotalSeasons) || parsedTotalSeasons < 1)) {
            return NextResponse.json({ error: "Geçersiz sezon sayısı" }, { status: 400 });
        }

        await prisma.series.update({
            where: { id: seriesId },
            data: {
                title,
                creator,
                coverImage: coverImage || null,
                genre: genre || null,
                totalSeasons: parsedTotalSeasons,
            },
        });

        const parsedLastSeason = lastSeason ? Number(lastSeason) : null;
        const parsedLastEpisode = lastEpisode ? Number(lastEpisode) : null;

        const userSeries = await prisma.userSeries.update({
            where: {
                id: userSeriesId,
                userId,
            },
            data: {
                overallStatus: status,
                ...(status === "COMPLETED" || status === "WISHLIST" ? {
                    lastSeason: null,
                    lastEpisode: null
                } : {
                    ...(lastSeason !== undefined && { lastSeason: parsedLastSeason || 1 }),
                    ...(lastEpisode !== undefined && { lastEpisode: parsedLastEpisode || 1 })
                }),
            },
            include: {
                series: { include: { seasons: true } },
                seasonStatuses: true,
            },
        });

        const standardizedResponse = {
            id: userSeries.id,
            mediaId: userSeries.seriesId,
            title: userSeries.series.title,
            subtitle: `${userSeries.series.creator} • ${userSeries.series.totalSeasons} Sezon`,
            image: userSeries.series.coverImage,
            coverImage: userSeries.series.coverImage,
            type: "series",
            status: userSeries.overallStatus,
            rating: userSeries.rating,
            isFavorite: userSeries.isFavorite,
            genre: userSeries.series.genre,
            updatedAt: userSeries.updatedAt.toISOString(),
            series: userSeries.series,
            seasonStatuses: userSeries.seasonStatuses
        };

        return NextResponse.json(standardizedResponse);
    } catch (error) {
        console.error("Dizi güncelleme hatası:", error);
        return NextResponse.json(
            { error: "Dizi güncellenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}


export async function PATCH(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { userSeriesId, status, rating, notes, seasonId, seasonStatus, isFavorite, lastSeason, lastEpisode } = body;

        if (status !== undefined) {
            const sv = mediaStatusSchema.safeParse(status);
            if (!sv.success) return NextResponse.json({ error: "Geçersiz durum değeri" }, { status: 400 });
        }
        if (rating !== undefined && rating !== null) {
            const rv = ratingSchema.safeParse(rating);
            if (!rv.success) return NextResponse.json({ error: "Puan 1-10 arasında olmalıdır" }, { status: 400 });
        }
        if (notes !== undefined) {
            const nv = notesSchema.safeParse(notes);
            if (!nv.success) return NextResponse.json({ error: "Notlar en fazla 5000 karakter olabilir" }, { status: 400 });
        }


        if (seasonId && seasonStatus) {
            const userSeries = await prisma.userSeries.findUnique({
                where: { id: userSeriesId, userId },
            });

            if (!userSeries) {
                return NextResponse.json({ error: "Dizi bulunamadı" }, { status: 404 });
            }

            await prisma.userSeasonStatus.upsert({
                where: {
                    userSeriesId_seasonId: {
                        userSeriesId,
                        seasonId,
                    },
                },
                update: { status: seasonStatus },
                create: {
                    userSeriesId,
                    seasonId,
                    status: seasonStatus,
                },
            });
        }


        const userSeries = await prisma.userSeries.update({
            where: {
                id: userSeriesId,
                userId,
            },
            data: {
                ...(status && { overallStatus: status }),
                ...(rating !== undefined && { rating }),
                ...(notes !== undefined && { notes }),
                ...(isFavorite !== undefined && { isFavorite }),
                // Logic: Clear episode tracking if completed or wishlist, otherwise update if provided
                ...(status === "COMPLETED" || status === "WISHLIST" ? {
                    lastSeason: null,
                    lastEpisode: null
                } : {
                    ...(lastSeason !== undefined && { lastSeason: lastSeason ? parseInt(lastSeason.toString()) : null }),
                    ...(lastEpisode !== undefined && { lastEpisode: lastEpisode ? parseInt(lastEpisode.toString()) : null })
                }),
            },
            include: {
                series: { include: { seasons: true } },
                seasonStatuses: true,
            },
        });


        const standardizedResponse = {
            id: userSeries.id,
            mediaId: userSeries.seriesId,
            title: userSeries.series.title,
            subtitle: `${userSeries.series.creator} • ${userSeries.series.totalSeasons} Sezon`,
            image: userSeries.series.coverImage,
            coverImage: userSeries.series.coverImage,
            type: "series",
            status: userSeries.overallStatus,
            rating: userSeries.rating,
            isFavorite: userSeries.isFavorite,
            genre: userSeries.series.genre,
            updatedAt: userSeries.updatedAt.toISOString(),
            series: userSeries.series,
            seasonStatuses: userSeries.seasonStatuses
        };

        return NextResponse.json(standardizedResponse);
    } catch (error) {
        console.error("Dizi güncelleme hatası:", error);
        return NextResponse.json(
            { error: "Dizi güncellenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}


export async function DELETE(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userSeriesId = searchParams.get("id");

        if (!userSeriesId) {
            return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
        }

        await prisma.userSeries.delete({
            where: {
                id: userSeriesId,
                userId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Dizi silme hatası:", error);
        return NextResponse.json(
            { error: "Dizi silinirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
