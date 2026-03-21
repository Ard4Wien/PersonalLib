import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BooksClient } from "@/components/media/books-client";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Kitaplarım | PersonalLib",
    description: "Kütüphanenizdeki kitapları yönetin",
};

export default async function BooksPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Başlangıçta kitapları server tarafında çekiyoruz
    const initialBooks = await prisma.userBook.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            book: true,
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    // Veriyi component'in beklediği formata sokuyoruz
    const formattedBooks = initialBooks.map((item: any) => ({
        id: item.id,
        mediaId: item.bookId,
        title: item.book?.title || "Bilinmeyen Kitap",
        subtitle: item.book?.author || "Bilinmeyen Yazar",
        image: item.book?.coverImage || null,
        type: "book" as const,
        status: item.status,
        isFavorite: item.isFavorite,
        genre: item.book?.genre || null,
        updatedAt: item.updatedAt.toISOString(),
        book: item.book,
    }));

    return <BooksClient initialBooks={formattedBooks} />;
}
