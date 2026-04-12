import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { seriesSchema, seriesUpdateSchema, seriesPatchSchema, mediaStatusSchema } from "@/lib/validations";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export const dynamic = 'force-dynamic';

// Yanıt formatını standartlaştırmak için yardımcı fonksiyon
function formatUserSeriesResponse(userSeries: any) {
    const series = userSeries.series;
    return {
        id: userSeries.id,
        mediaId: userSeries.seriesId,
        title: series.title,
        subtitle: `${series.creator || "Bilinmeyen Yapımcı"} • ${series.totalSeasons || 1} Sezon`,
        image: series.coverImage,
        coverImage: series.coverImage,
        type: "series",
        status: userSeries.overallStatus,
        isFavorite: userSeries.isFavorite,
        genre: series.genre || "",
        totalSeasons: series.totalSeasons || 1,
        updatedAt: userSeries.updatedAt.toISOString(),
        series: series,
        seasonStatuses: userSeries.seasonStatuses || []
    };
}


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


        const standardizedSeries = userSeries.map(formatUserSeriesResponse);

        return NextResponse.json(standardizedSeries);
    } catch {
        return NextResponse.json(
            { error: "Diziler listelenirken bir sorun oluştu" },
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


        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: rateLimitResult.message },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { status = "WISHLIST", lastSeason, lastEpisode, ...seriesData } = body;

        const statusValidation = mediaStatusSchema.safeParse(status);
        if (!statusValidation.success) {
            return NextResponse.json({ error: "Geçersiz durum değeri" }, { status: 400 });
        }

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
                    lastSeason: lastSeason || 1,
                    lastEpisode: lastEpisode || 1,
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


        return NextResponse.json(formatUserSeriesResponse(userSeries), { status: 201 });
    } catch (err) {
        console.error("series POST:", err);
        return NextResponse.json({ error: "Dizi eklenemedi" }, { status: 500 });
    }
}


export async function PUT(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }


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

        let targetSeries = await prisma.series.findFirst({
            where: { title, creator },
        });

        if (targetSeries && targetSeries.id !== seriesId) {
            const userHasTarget = await prisma.userSeries.findUnique({
                where: { userId_seriesId: { userId, seriesId: targetSeries.id } }
            });
            if (userHasTarget) {
                return NextResponse.json({ error: "Bu isimde bir dizi zaten kütüphanenizde var" }, { status: 400 });
            }
        }

        if (!targetSeries || targetSeries.id === seriesId) {
            const ownerCount = await prisma.userSeries.count({ where: { seriesId } });
            const newTotalSeasons = totalSeasons || 1;

            if (ownerCount === 1) {
                targetSeries = await prisma.series.update({
                    where: { id: seriesId },
                    data: { 
                        title, 
                        creator, 
                        coverImage: coverImage || null, 
                        genre: genre || null, 
                        totalSeasons: newTotalSeasons 
                    },
                });
            } else {
                const originalSeries = await prisma.series.findUnique({ where: { id: seriesId } });
                targetSeries = await prisma.series.create({
                    data: { 
                        title, 
                        creator, 
                        coverImage: coverImage || null, 
                        genre: genre || null,
                        totalSeasons: newTotalSeasons,
                        imdbId: originalSeries?.imdbId,
                    },
                });
            }

            // Sezon Kayıtlarını Senkronize Et (Senkronizasyon Hardening)
            const currentSeasons = await prisma.season.findMany({ where: { seriesId: targetSeries.id } });
            if (currentSeasons.length !== newTotalSeasons) {
                if (currentSeasons.length < newTotalSeasons) {
                    await prisma.season.createMany({
                        data: Array.from({ length: newTotalSeasons - currentSeasons.length }, (_, i) => ({
                            seriesId: targetSeries!.id,
                            seasonNumber: currentSeasons.length + i + 1,
                        })),
                    });
                } else {
                    await prisma.season.deleteMany({
                        where: {
                            seriesId: targetSeries.id,
                            seasonNumber: { gt: newTotalSeasons },
                        },
                    });
                }
            }
        }

        const userSeries = await prisma.userSeries.update({
            where: { id: userSeriesId, userId },
            data: {
                overallStatus: status,
                seriesId: targetSeries.id,
                ...(status === "COMPLETED" || status === "WISHLIST" ? {
                    lastSeason: null,
                    lastEpisode: null
                } : {
                    ...(lastSeason !== undefined && { lastSeason: lastSeason || 1 }),
                    ...(lastEpisode !== undefined && { lastEpisode: lastEpisode || 1 })
                }),
            },
            include: {
                series: { include: { seasons: true } },
                seasonStatuses: true,
            },
        });

        if (targetSeries.id !== seriesId) {
             const oldSeriesCount = await prisma.userSeries.count({ where: { seriesId } });
             if (oldSeriesCount === 0) await prisma.series.delete({ where: { id: seriesId } }).catch(() => {});
        }

        return NextResponse.json(formatUserSeriesResponse(userSeries));
    } catch {
        return NextResponse.json(
            { error: "Dizi güncellenemedi" },
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
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const validatedFields = seriesPatchSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { userSeriesId, status, isFavorite, lastSeason, lastEpisode, seasonId, seasonStatus } = validatedFields.data;


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
                ...(isFavorite !== undefined && { isFavorite }),

                ...(status === "COMPLETED" || status === "WISHLIST" ? {
                    lastSeason: null,
                    lastEpisode: null
                } : {
                    ...(lastSeason !== undefined && { lastSeason: lastSeason || null }),
                    ...(lastEpisode !== undefined && { lastEpisode: lastEpisode || null })
                }),
            },
            include: {
                series: { include: { seasons: true } },
                seasonStatuses: true,
            },
        });


        return NextResponse.json(formatUserSeriesResponse(userSeries));
    } catch {
        return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }
}


export async function DELETE(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const { searchParams } = new URL(request.url);
        const userSeriesId = searchParams.get("id");

        if (!userSeriesId) {
            return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
        }

        // Silmeden önce seriesId'yi al (yetim kayıt temizliği için)
        const userSeries = await prisma.userSeries.findUnique({
            where: { id: userSeriesId, userId },
            select: { seriesId: true }
        });

        if (!userSeries) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
        }

        await prisma.userSeries.delete({
            where: {
                id: userSeriesId,
                userId,
            },
        });

        // Yetim kayıt temizliği: Artık hiçbir kullanıcıya ait olmayan Series'i sil
        // (Cascade ile Season kayıtları da otomatik silinir)
        const remainingOwners = await prisma.userSeries.count({ where: { seriesId: userSeries.seriesId } });
        if (remainingOwners === 0) {
            await prisma.series.delete({ where: { id: userSeries.seriesId } }).catch(() => {});
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Silme işlemi sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
