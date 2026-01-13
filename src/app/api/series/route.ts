import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { seriesSchema } from "@/lib/validations";

export const dynamic = 'force-dynamic';

// GET - Kullanıcının dizilerini listele
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const userSeries = await prisma.userSeries.findMany({
            where: { userId: session.user.id },
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
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
                    ...validatedFields.data,
                    seasons: {
                        create: Array.from({ length: validatedFields.data.totalSeasons }, (_, i) => ({
                            seasonNumber: i + 1,
                        })),
                    },
                },
                include: { seasons: true },
            });
        }

        // Kullanıcı-dizi ilişkisini kontrol et
        const existingUserSeries = await prisma.userSeries.findUnique({
            where: {
                userId_seriesId: {
                    userId: session.user.id,
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
                userId: session.user.id,
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

// PATCH - Dizi durumunu güncelle
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { userSeriesId, status, rating, notes, seasonId, seasonStatus } = body;

        // Sezon durumu güncellemesi
        if (seasonId && seasonStatus) {
            const userSeries = await prisma.userSeries.findUnique({
                where: { id: userSeriesId, userId: session.user.id },
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
                userId: session.user.id,
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
        const session = await auth();
        if (!session?.user?.id) {
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
                userId: session.user.id,
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
