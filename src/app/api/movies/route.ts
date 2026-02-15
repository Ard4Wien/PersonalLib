import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { movieSchema, movieUpdateSchema, mediaStatusSchema, ratingSchema, notesSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const userMovies = await prisma.userMovie.findMany({
            where: { userId },
            include: { movie: true },
            orderBy: { updatedAt: "desc" },
        });


        const standardizedMovies = userMovies.map((um) => ({
            id: um.id,
            mediaId: um.movieId,
            title: um.movie.title,
            subtitle: um.movie.director || "Bilinmeyen Yönetmen",
            image: um.movie.coverImage,
            coverImage: um.movie.coverImage,
            type: "movie",
            status: um.status,
            rating: um.rating,
            isFavorite: um.isFavorite,
            updatedAt: um.updatedAt.toISOString(),

            movie: um.movie
        }));

        return NextResponse.json(standardizedMovies);
    } catch (error) {
        console.error("Film listesi hatası:", error);
        return NextResponse.json(
            { error: "Filmler yüklenirken bir hata oluştu" },
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
        const { status = "WISHLIST", ...movieData } = body;

        const validatedFields = movieSchema.safeParse(movieData);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }


        let movie = await prisma.movie.findFirst({
            where: {
                OR: [
                    { title: validatedFields.data.title, director: validatedFields.data.director },
                    ...(validatedFields.data.imdbId ? [{ imdbId: validatedFields.data.imdbId }] : []),
                ],
            },
        });

        if (!movie) {
            movie = await prisma.movie.create({
                data: {
                    title: validatedFields.data.title,
                    ...(validatedFields.data.director && { director: validatedFields.data.director }),
                    ...(validatedFields.data.coverImage && { coverImage: validatedFields.data.coverImage }),
                    ...(validatedFields.data.description && { description: validatedFields.data.description }),
                    ...(validatedFields.data.releaseYear && { releaseYear: validatedFields.data.releaseYear }),
                    ...(validatedFields.data.genre && { genre: validatedFields.data.genre }),
                    ...(validatedFields.data.duration && { duration: validatedFields.data.duration }),
                    ...(validatedFields.data.imdbId && { imdbId: validatedFields.data.imdbId }),
                } as any,
            });
        }


        const existingUserMovie = await prisma.userMovie.findUnique({
            where: {
                userId_movieId: {
                    userId,
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


        const userMovie = await prisma.userMovie.create({
            data: {
                userId,
                movieId: movie.id,
                status,
            },
            include: { movie: true },
        });


        const standardizedResponse = {
            id: userMovie.id,
            mediaId: userMovie.movieId,
            title: userMovie.movie.title,
            subtitle: userMovie.movie.director || "Bilinmeyen Yönetmen",
            image: userMovie.movie.coverImage,
            coverImage: userMovie.movie.coverImage,
            type: "movie",
            status: userMovie.status,
            rating: userMovie.rating,
            isFavorite: userMovie.isFavorite,
            genre: userMovie.movie.genre,
            updatedAt: userMovie.updatedAt.toISOString(),
            movie: userMovie.movie
        };

        return NextResponse.json(standardizedResponse, { status: 201 });
    } catch (error) {
        console.error("Film ekleme hatası:", error);
        return NextResponse.json(
            { error: "Film eklenirken bir hata oluştu" },
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

        const validatedFields = movieUpdateSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { userMovieId, movieId, title, director, coverImage, genre, status } = validatedFields.data;

        const existingUserMovie = await prisma.userMovie.findUnique({
            where: { id: userMovieId, userId },
            select: { movieId: true }
        });

        if (!existingUserMovie) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
        }

        if (existingUserMovie.movieId !== movieId) {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }

        await prisma.movie.update({
            where: { id: movieId },
            data: {
                title,
                director,
                coverImage: coverImage || null,
                genre: genre || null,
            },
        });

        const userMovie = await prisma.userMovie.update({
            where: {
                id: userMovieId,
                userId,
            },
            data: {
                status,
            },
            include: { movie: true },
        });

        const standardizedResponse = {
            id: userMovie.id,
            mediaId: userMovie.movieId,
            title: userMovie.movie.title,
            subtitle: userMovie.movie.director || "Bilinmeyen Yönetmen",
            image: userMovie.movie.coverImage,
            coverImage: userMovie.movie.coverImage,
            type: "movie",
            status: userMovie.status,
            rating: userMovie.rating,
            isFavorite: userMovie.isFavorite,
            genre: userMovie.movie.genre,
            updatedAt: userMovie.updatedAt.toISOString(),
            movie: userMovie.movie
        };

        return NextResponse.json(standardizedResponse);
    } catch (error) {
        console.error("Film güncelleme hatası:", error);
        return NextResponse.json(
            { error: "Film güncellenirken bir hata oluştu" },
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
        const { userMovieId, status, rating, notes, isFavorite } = body;

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

        const userMovie = await prisma.userMovie.update({
            where: {
                id: userMovieId,
                userId,
            },
            data: {
                ...(status && { status }),
                ...(rating !== undefined && { rating }),
                ...(notes !== undefined && { notes }),
                ...(isFavorite !== undefined && { isFavorite }),
                ...(status === "COMPLETED" && { watchedDate: new Date() }),
            },
            include: { movie: true },
        });


        const standardizedResponse = {
            id: userMovie.id,
            mediaId: userMovie.movieId,
            title: userMovie.movie.title,
            subtitle: userMovie.movie.director || "Bilinmeyen Yönetmen",
            image: userMovie.movie.coverImage,
            coverImage: userMovie.movie.coverImage,
            type: "movie",
            status: userMovie.status,
            rating: userMovie.rating,
            isFavorite: userMovie.isFavorite,
            genre: userMovie.movie.genre,
            updatedAt: userMovie.updatedAt.toISOString(),
            movie: userMovie.movie
        };

        return NextResponse.json(standardizedResponse);
    } catch (error) {
        console.error("Film güncelleme hatası:", error);
        return NextResponse.json(
            { error: "Film güncellenirken bir hata oluştu" },
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
        const userMovieId = searchParams.get("id");

        if (!userMovieId) {
            return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
        }

        await prisma.userMovie.delete({
            where: {
                id: userMovieId,
                userId,
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
