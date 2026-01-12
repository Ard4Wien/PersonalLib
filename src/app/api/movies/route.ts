import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { movieSchema } from "@/lib/validations";

// GET - Kullanıcının filmlerini listele
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const userMovies = await prisma.userMovie.findMany({
            where: { userId: session.user.id },
            include: { movie: true },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(userMovies);
    } catch (error) {
        console.error("Film listesi hatası:", error);
        return NextResponse.json(
            { error: "Filmler yüklenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// POST - Yeni film ekle
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { status = "WISHLIST", ...movieData } = body;

        const validatedFields = movieSchema.safeParse(movieData);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Filmi oluştur veya mevcut olanı bul
        let movie = await prisma.movie.findFirst({
            where: { title: validatedFields.data.title, director: validatedFields.data.director },
        });

        if (!movie) {
            movie = await prisma.movie.create({
                data: validatedFields.data,
            });
        }

        // Kullanıcı-film ilişkisini kontrol et
        const existingUserMovie = await prisma.userMovie.findUnique({
            where: {
                userId_movieId: {
                    userId: session.user.id,
                    movieId: movie.id,
                },
            },
        });

        if (existingUserMovie) {
            return NextResponse.json(
                { error: "Bu film zaten kütüphanenizde" },
                { status: 400 }
            );
        }

        // Kullanıcı-film ilişkisini oluştur
        const userMovie = await prisma.userMovie.create({
            data: {
                userId: session.user.id,
                movieId: movie.id,
                status,
            },
            include: { movie: true },
        });

        return NextResponse.json(userMovie, { status: 201 });
    } catch (error) {
        console.error("Film ekleme hatası:", error);
        return NextResponse.json(
            { error: "Film eklenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// PATCH - Film durumunu güncelle
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const body = await request.json();
        const { userMovieId, status, rating, notes } = body;

        const userMovie = await prisma.userMovie.update({
            where: {
                id: userMovieId,
                userId: session.user.id,
            },
            data: {
                ...(status && { status }),
                ...(rating !== undefined && { rating }),
                ...(notes !== undefined && { notes }),
                ...(status === "COMPLETED" && { watchedDate: new Date() }),
            },
            include: { movie: true },
        });

        return NextResponse.json(userMovie);
    } catch (error) {
        console.error("Film güncelleme hatası:", error);
        return NextResponse.json(
            { error: "Film güncellenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// DELETE - Filmi kaldır
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userMovieId = searchParams.get("id");

        if (!userMovieId) {
            return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
        }

        await prisma.userMovie.delete({
            where: {
                id: userMovieId,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Film silme hatası:", error);
        return NextResponse.json(
            { error: "Film silinirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
