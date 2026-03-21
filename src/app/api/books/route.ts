import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookSchema, bookUpdateSchema, mediaStatusSchema } from "@/lib/validations";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const userBooks = await prisma.userBook.findMany({
            where: { userId },
            include: { book: true },
            orderBy: { updatedAt: "desc" },
        });


        const standardizedBooks = userBooks.map((ub) => ({
            id: ub.id,
            mediaId: ub.bookId,
            title: ub.book.title,
            subtitle: ub.book.author || "Bilinmeyen Yazar",
            image: ub.book.coverImage,
            coverImage: ub.book.coverImage,
            type: "book",
            status: ub.status,
            isFavorite: ub.isFavorite,
            genre: ub.book.genre,
            updatedAt: ub.updatedAt.toISOString(),
            book: ub.book
        }));

        return NextResponse.json(standardizedBooks);
    } catch (error) {
        console.error("Kitap hatası");
        return NextResponse.json(
            { error: "Kitaplar yüklenirken bir hata oluştu" },
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

        const body = await request.json();
        const { status = "WISHLIST", ...bookData } = body;

        const statusValidation = mediaStatusSchema.safeParse(status);
        if (!statusValidation.success) {
            return NextResponse.json({ error: "Geçersiz durum değeri" }, { status: 400 });
        }

        const clientIP = getClientIP(request);
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.success) {
            return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
        }

        const validatedFields = bookSchema.safeParse(bookData);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }


        let book = await prisma.book.findFirst({
            where: {
                OR: [
                    { title: validatedFields.data.title, author: validatedFields.data.author },
                    ...(validatedFields.data.isbn ? [{ isbn: validatedFields.data.isbn }] : []),
                ],
            },
        });

        if (!book) {
            book = await prisma.book.create({
                data: validatedFields.data,
            });
        }


        const existingUserBook = await prisma.userBook.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId: book.id,
                },
            },
        });

        if (existingUserBook) {
            return NextResponse.json(
                { error: "Bu kitap zaten kütüphanenizde" },
                { status: 400 }
            );
        }


        const userBook = await prisma.userBook.create({
            data: {
                userId,
                bookId: book.id,
                status,
            },
            include: { book: true },
        });


        const standardizedResponse = {
            id: userBook.id,
            mediaId: userBook.bookId,
            title: userBook.book.title,
            subtitle: userBook.book.author || "Bilinmeyen Yazar",
            image: userBook.book.coverImage,
            coverImage: userBook.book.coverImage,
            type: "book",
            status: userBook.status,
            isFavorite: userBook.isFavorite,
            genre: userBook.book.genre,
            updatedAt: userBook.updatedAt.toISOString(),
            book: userBook.book
        };

        return NextResponse.json(standardizedResponse, { status: 201 });
    } catch (error) {
        console.error("Kitap hatası");
        return NextResponse.json(
            { error: "Kitap eklenirken bir hata oluştu" },
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

        const validatedFields = bookUpdateSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { userBookId, bookId, title, author, coverImage, genre, status } = validatedFields.data;

        const existingUserBook = await prisma.userBook.findUnique({
            where: { id: userBookId, userId },
            select: { bookId: true }
        });

        if (!existingUserBook) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
        }

        if (existingUserBook.bookId !== bookId) {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }

        let targetBook = await prisma.book.findFirst({
            where: { title, author },
        });

        if (targetBook && targetBook.id !== bookId) {
            const userHasTarget = await prisma.userBook.findUnique({
                where: { userId_bookId: { userId, bookId: targetBook.id } }
            });
            if (userHasTarget) {
                return NextResponse.json({ error: "Bu isimde bir kitap zaten kütüphanenizde var" }, { status: 400 });
            }
        }

        if (!targetBook || targetBook.id === bookId) {
            const ownerCount = await prisma.userBook.count({ where: { bookId } });
            if (ownerCount === 1) {
                targetBook = await prisma.book.update({
                    where: { id: bookId },
                    data: { title, author, coverImage: coverImage || null, genre: genre || null },
                });
            } else {
                const originalBook = await prisma.book.findUnique({ where: { id: bookId } });
                targetBook = await prisma.book.create({
                    data: { 
                        title, 
                        author, 
                        coverImage: coverImage || null, 
                        genre: genre || null,
                        isbn: originalBook?.isbn 
                    },
                });
            }
        }

        const userBook = await prisma.userBook.update({
            where: { id: userBookId, userId },
            data: { status, bookId: targetBook.id },
            include: { book: true },
        });

        if (targetBook.id !== bookId) {
             const oldBookCount = await prisma.userBook.count({ where: { bookId } });
             if (oldBookCount === 0) await prisma.book.delete({ where: { id: bookId } }).catch(() => {});
        }

        return NextResponse.json(userBook);
    } catch (error) {
        console.error("Kitap hatası");
        return NextResponse.json(
            { error: "Kitap güncellenirken bir hata oluştu" },
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
        const { userBookId, status, isFavorite } = body;

        if (!userBookId || typeof userBookId !== "string") {
            return NextResponse.json({ error: "Geçerli bir kayıt ID'si gereklidir" }, { status: 400 });
        }

        if (status !== undefined) {
            const sv = mediaStatusSchema.safeParse(status);
            if (!sv.success) return NextResponse.json({ error: "Geçersiz durum değeri" }, { status: 400 });
        }
        if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
            return NextResponse.json({ error: "Geçersiz favori değeri" }, { status: 400 });
        }

        const userBook = await prisma.userBook.update({
            where: {
                id: userBookId,
                userId,
            },
            data: {
                ...(status && { status }),
                ...(isFavorite !== undefined && { isFavorite }),
            },
            include: { book: true },
        });

        return NextResponse.json(userBook);
    } catch (error) {
        console.error("Kitap hatası");
        return NextResponse.json(
            { error: "Kitap güncellenirken bir hata oluştu" },
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
        const userBookId = searchParams.get("id");

        if (!userBookId) {
            return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
        }

        await prisma.userBook.delete({
            where: {
                id: userBookId,
                userId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Kitap hatası");
        return NextResponse.json(
            { error: "Kitap silinirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
