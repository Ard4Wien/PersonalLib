import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookSchema } from "@/lib/validations";
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
            rating: ub.rating,
            isFavorite: ub.isFavorite,
            genre: ub.book.genre,
            updatedAt: ub.updatedAt.toISOString(),
            book: ub.book
        }));

        return NextResponse.json(standardizedBooks);
    } catch (error) {
        console.error("Kitap listesi hatası:", error);
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
            rating: userBook.rating,
            isFavorite: userBook.isFavorite,
            genre: userBook.book.genre,
            updatedAt: userBook.updatedAt.toISOString(),
            book: userBook.book
        };

        return NextResponse.json(standardizedResponse, { status: 201 });
    } catch (error) {
        console.error("Kitap ekleme hatası:", error);
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
        const { userBookId, bookId, title, author, coverImage, genre, status } = body;


        await prisma.book.update({
            where: { id: bookId },
            data: {
                title,
                author,
                coverImage: coverImage || null,
                genre: genre || null,
            },
        });


        const userBook = await prisma.userBook.update({
            where: {
                id: userBookId,
                userId,
            },
            data: {
                status,
            },
            include: { book: true },
        });

        return NextResponse.json(userBook);
    } catch (error) {
        console.error("Kitap güncelleme hatası:", error);
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
        const { userBookId, status, rating, notes, isFavorite } = body;

        const userBook = await prisma.userBook.update({
            where: {
                id: userBookId,
                userId,
            },
            data: {
                ...(status && { status }),
                ...(rating !== undefined && { rating }),
                ...(notes !== undefined && { notes }),
                ...(isFavorite !== undefined && { isFavorite }),
                ...(status === "COMPLETED" && { endDate: new Date() }),
                ...(status === "READING" && { startDate: new Date() }),
            },
            include: { book: true },
        });

        return NextResponse.json(userBook);
    } catch (error) {
        console.error("Kitap güncelleme hatası:", error);
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
        console.error("Kitap silme hatası:", error);
        return NextResponse.json(
            { error: "Kitap silinirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
