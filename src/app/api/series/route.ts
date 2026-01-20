import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { seriesSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export const dynamic = 'force-dynamic';

// GET - Kullanıcının dizilerini listele
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

        return NextResponse.json(userSeries);
    } catch (error) {
        console.error("Dizi listesi hatası:", error);
        return NextResponse.json(
            { error: "Diziler yüklenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// POST - Yeni dizi ekle
export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        // Rate limiting kontrolü
        const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const rateLimitResult = checkRateLimit(clientIP);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: rateLimitResult.message },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { status = "WISHLIST", seasons = [], ...seriesData } = body;

        const validatedFields = seriesSchema.safeParse(seriesData);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Diziyi oluştur veya mevcut olanı bul
        let series = await prisma.series.findFirst({
            where: { title: validatedFields.data.title, creator: validatedFields.data.creator },
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

        // Kullanıcı-dizi ilişkisini kontrol et
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

        // Kullanıcı-dizi ilişkisini oluştur
        const userSeries = await prisma.userSeries.create({
            data: {
                userId,
                seriesId: series.id,
                overallStatus: status,
            },
            include: {
                series: { include: { seasons: true } },
            },
        });

        return NextResponse.json(userSeries, { status: 201 });
    } catch (error) {
        console.error("Dizi ekleme hatası:", error);
        return NextResponse.json(
            { error: "Dizi eklenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// PUT - Dizi bilgilerini güncelle
export async function PUT(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { userSeriesId, seriesId, title, creator, coverImage, genre, totalSeasons, status } = body;

        // Dizi bilgilerini güncelle
        await prisma.series.update({
            where: { id: seriesId },
            data: {
                title,
                creator,
                coverImage: coverImage || null,
                genre: genre || null,
                totalSeasons: totalSeasons ? parseInt(totalSeasons) : undefined,
            },
        });

        // UserSeries durumunu güncelle
        const userSeries = await prisma.userSeries.update({
            where: {
                id: userSeriesId,
                userId,
            },
            data: {
                overallStatus: status,
            },
            include: {
                series: { include: { seasons: true } },
                seasonStatuses: true,
            },
        });

        return NextResponse.json(userSeries);
    } catch (error) {
        console.error("Dizi güncelleme hatası:", error);
        return NextResponse.json(
            { error: "Dizi güncellenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// PATCH - Dizi durumunu güncelle
export async function PATCH(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { userSeriesId, status, rating, notes, seasonId, seasonStatus } = body;

        // Sezon durumu güncellemesi
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

        // Genel dizi durumu güncellemesi
        const userSeries = await prisma.userSeries.update({
            where: {
                id: userSeriesId,
                userId,
            },
            data: {
                ...(status && { overallStatus: status }),
                ...(rating !== undefined && { rating }),
                ...(notes !== undefined && { notes }),
            },
            include: {
                series: { include: { seasons: true } },
                seasonStatuses: true,
            },
        });

        return NextResponse.json(userSeries);
    } catch (error) {
        console.error("Dizi güncelleme hatası:", error);
        return NextResponse.json(
            { error: "Dizi güncellenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// DELETE - Diziyi kaldır
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
