import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { movieSchema, movieUpdateSchema, moviePatchSchema, mediaStatusSchema } from "@/lib/validations";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
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
            isFavorite: um.isFavorite,
            updatedAt: um.updatedAt.toISOString(),

            movie: um.movie
        }));

        return NextResponse.json(standardizedMovies);
    } catch (error) {
        console.error("Film hatası");
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


        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: rateLimitResult.message },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { status = "WISHLIST", ...movieData } = body;

        const statusValidation = mediaStatusSchema.safeParse(status);
        if (!statusValidation.success) {
            return NextResponse.json({ error: "Geçersiz durum değeri" }, { status: 400 });
        }

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
            isFavorite: userMovie.isFavorite,
            genre: userMovie.movie.genre,
            updatedAt: userMovie.updatedAt.toISOString(),
            movie: userMovie.movie
        };

        return NextResponse.json(standardizedResponse, { status: 201 });
    } catch (error) {
        console.error("Film hatası");
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
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }


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

        let targetMovie = await prisma.movie.findFirst({
            where: { title, director },
        });

        if (targetMovie && targetMovie.id !== movieId) {
            const userHasTarget = await prisma.userMovie.findUnique({
                where: { userId_movieId: { userId, movieId: targetMovie.id } }
            });
            if (userHasTarget) {
                return NextResponse.json({ error: "Bu isimde bir film zaten kütüphanenizde var" }, { status: 400 });
            }
        }

        if (!targetMovie || targetMovie.id === movieId) {
            const ownerCount = await prisma.userMovie.count({ where: { movieId } });
            if (ownerCount === 1) {
                targetMovie = await prisma.movie.update({
                    where: { id: movieId },
                    data: { title, director, coverImage: coverImage || null, genre: genre || null },
                });
            } else {
                const originalMovie = await prisma.movie.findUnique({ where: { id: movieId } });
                targetMovie = await prisma.movie.create({
                    data: { 
                        title, 
                        director, 
                        coverImage: coverImage || null, 
                        genre: genre || null,
                        imdbId: originalMovie?.imdbId 
                    },
                });
            }
        }

        const userMovie = await prisma.userMovie.update({
            where: { id: userMovieId, userId },
            data: { status, movieId: targetMovie.id },
            include: { movie: true },
        });

        if (targetMovie.id !== movieId) {
             const oldMovieCount = await prisma.userMovie.count({ where: { movieId } });
             if (oldMovieCount === 0) await prisma.movie.delete({ where: { id: movieId } }).catch(() => {});
        }

        const standardizedResponse = {
            id: userMovie.id,
            mediaId: userMovie.movieId,
            title: userMovie.movie.title,
            subtitle: userMovie.movie.director || "Bilinmeyen Yönetmen",
            image: userMovie.movie.coverImage,
            coverImage: userMovie.movie.coverImage,
            type: "movie",
            status: userMovie.status,
            isFavorite: userMovie.isFavorite,
            genre: userMovie.movie.genre,
            updatedAt: userMovie.updatedAt.toISOString(),
            movie: userMovie.movie
        };

        return NextResponse.json(standardizedResponse);
    } catch (error) {
        console.error("Film hatası");
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
        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const validatedFields = moviePatchSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { userMovieId, status, isFavorite } = validatedFields.data;

        const userMovie = await prisma.userMovie.update({
            where: {
                id: userMovieId,
                userId,
            },
            data: {
                ...(status && { status }),
                ...(isFavorite !== undefined && { isFavorite }),
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
            isFavorite: userMovie.isFavorite,
            genre: userMovie.movie.genre,
            updatedAt: userMovie.updatedAt.toISOString(),
            movie: userMovie.movie
        };

        return NextResponse.json(standardizedResponse);
    } catch (error) {
        console.error("Film hatası");
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

        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const { searchParams } = new URL(request.url);
        const userMovieId = searchParams.get("id");

        if (!userMovieId) {
            return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
        }

        // Silmeden önce movieId'yi al (yetim kayıt temizliği için)
        const userMovie = await prisma.userMovie.findUnique({
            where: { id: userMovieId, userId },
            select: { movieId: true }
        });

        if (!userMovie) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
        }

        await prisma.userMovie.delete({
            where: {
                id: userMovieId,
                userId,
            },
        });

        // Yetim kayıt temizliği: Artık hiçbir kullanıcıya ait olmayan Movie'yi sil
        const remainingOwners = await prisma.userMovie.count({ where: { movieId: userMovie.movieId } });
        if (remainingOwners === 0) {
            await prisma.movie.delete({ where: { id: userMovie.movieId } }).catch(() => {});
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Film hatası");
        return NextResponse.json(
            { error: "Film silinirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
