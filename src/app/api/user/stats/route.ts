import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);

        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const [bookStats, movieStats, seriesStats] = await Promise.all([
            prisma.userBook.count({
                where: {
                    userId: userId,
                    status: "COMPLETED"
                }
            }),
            prisma.userMovie.count({
                where: {
                    userId: userId,
                    status: "COMPLETED"
                }
            }),
            prisma.userSeries.count({
                where: {
                    userId: userId,
                    overallStatus: "COMPLETED"
                }
            })
        ]);

        return NextResponse.json({
            books: bookStats,
            movies: movieStats,
            series: seriesStats
        });
    } catch (error) {
        console.error("Stats fetching error:", error);
        return NextResponse.json({ error: "İstatistikler yüklenemedi" }, { status: 500 });
    }
}
