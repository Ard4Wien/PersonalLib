import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);
        if (!userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json({ error: "Arama terimi gerekli" }, { status: 400 });
        }


        const prhApiKey = process.env.PRH_API_KEY;
        const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY;

        const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15&langRestrict=tr,en${googleApiKey ? `&key=${googleApiKey}` : ""}`;

        const fetchPromises: Promise<any>[] = [
            fetch(googleUrl).catch(() => null),
            fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15`, {
                headers: { 'User-Agent': 'PersonalLib/1.0 (Mobile Media Library App)' }
            }).catch(() => null)
        ];

        if (prhApiKey) {
            fetchPromises.push(
                fetch(`https://api.penguinrandomhouse.com/resources/v2/title/domains/PRH.US/search?q=${encodeURIComponent(query)}&rows=15&api_key=${prhApiKey}`).catch(() => null)
            );
        }

        const responses = await Promise.all(fetchPromises);
        const [googleResponse, openLibraryResponse, prhResponse] = responses;

        let googleResults: any[] = [];
        let openLibraryResults: any[] = [];
        let prhResults: any[] = [];


        if (googleResponse?.ok) {
            const data = await googleResponse.json();
            googleResults = (data.items || []).map((item: any) => {
                const info = item.volumeInfo;
                let coverImage = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "";
                if (coverImage) {
                    if (coverImage.startsWith("http://")) coverImage = coverImage.replace("http://", "https://");
                    coverImage = coverImage.replace("&edge=curl", "");
                }
                return {
                    id: `google-${item.id}`,
                    title: info.title,
                    subtitle: info.authors ? info.authors.join(", ") : "Bilinmiyor",
                    author: info.authors ? info.authors.join(", ") : "Bilinmiyor",
                    image: coverImage,
                    coverImage: coverImage,
                    type: "book",
                    publishedYear: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : undefined,
                    genre: info.categories ? info.categories[0] : "",
                    source: "google"
                };
            });
        }


        if (openLibraryResponse?.ok) {
            const data = await openLibraryResponse.json();
            openLibraryResults = (data.docs || []).map((doc: any) => {
                const coverId = doc.cover_i;
                return {
                    id: `ol-${doc.key.replace("/works/", "")}`,
                    title: doc.title,
                    subtitle: doc.author_name ? doc.author_name.join(", ") : "Bilinmiyor",
                    author: doc.author_name ? doc.author_name.join(", ") : "Bilinmiyor",
                    image: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "",
                    coverImage: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "",
                    type: "book",
                    publishedYear: doc.first_publish_year || undefined,
                    genre: doc.subject ? doc.subject[0] : "",
                    source: "openlibrary"
                };
            });
        }


        let prhStatus = "active";
        if (prhResponse?.ok) {
            const json = await prhResponse.json();
            const results = json.data?.results || json.results || [];

            prhResults = results.map((item: any) => {
                const authorData = item.author ? item.author[0] : "";
                const authorName = authorData.includes("|") ? authorData.split("|")[1] : authorData || "Bilinmiyor";


                let coverLink = item._links?.find((l: any) => l.rel === "icon" || l.rel === "thumbnail")?.href || "";


                const isbn = item.isbn || item.isbn13;
                if (!coverLink && isbn) {
                    coverLink = `https://images.penguinrandomhouse.com/cover/${isbn}`;
                }


                if (!coverLink && item.key) {
                    coverLink = `https://images.penguinrandomhouse.com/cover/work/${item.key}`;
                }

                return {
                    id: `prh-${item.key || item.id}`,
                    title: item.name,
                    subtitle: authorName,
                    author: authorName,
                    image: coverLink,
                    coverImage: coverLink,
                    type: "BOOK",
                    publishedYear: item.pub_date ? parseInt(item.pub_date.substring(0, 4)) : undefined,
                    genre: item.d_format_desc || undefined,
                    source: "prh"
                };
            });
        } else if (prhApiKey) {
            prhStatus = `failed (${prhResponse?.status || 'network error'})`;
            console.warn(`[PRH Debug] PRH API Fetch failed: ${prhStatus}`);
        } else {
            prhStatus = "no key";
        }


        const getScore = (item: any, query: string) => {
            let score = 0;
            const lowerQuery = query.toLowerCase().trim();
            const lowerTitle = item.title.toLowerCase();


            if (lowerTitle === lowerQuery) score += 10;
            else if (lowerTitle.startsWith(lowerQuery)) score += 7;
            else if (lowerTitle.includes(lowerQuery)) score += 5;


            const isPlaceholder = item.coverImage && (
                item.coverImage.includes("content?id=uS4VAAAAMAAJ") ||
                item.coverImage.includes("fife/") ||
                item.coverImage.includes("nopic")
            );

            if (item.coverImage && !isPlaceholder) score += 4;
            if (item.author && item.author !== "Bilinmiyor") score += 3;
            if (item.genre) score += 2;

            return score;
        };


        const scoreAndSort = (results: any[]) => {
            return results
                .map(item => ({ ...item, score: getScore(item, query) }))
                .sort((a, b) => b.score - a.score);
        };

        const sortedGoogle = scoreAndSort(googleResults);
        const sortedOL = scoreAndSort(openLibraryResults);
        const sortedPRH = scoreAndSort(prhResults);


        const finalResults = [];
        const maxLength = Math.max(sortedGoogle.length, sortedOL.length, sortedPRH.length);

        for (let i = 0; i < maxLength; i++) {

            if (i < sortedGoogle.length) finalResults.push(sortedGoogle[i]);
            if (i < sortedPRH.length) finalResults.push(sortedPRH[i]);
            if (i < sortedOL.length) finalResults.push(sortedOL[i]);
        }


        const cleanResults = finalResults
            .map(({ score, ...item }: any) => item)
            .slice(0, 40);


        return NextResponse.json(cleanResults);
    } catch (error: any) {
        let errorMessage = error?.message || "Kitaplar aranırken bir hata oluştu";
        const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY;
        if (googleApiKey) errorMessage = errorMessage.replace(googleApiKey, "[MASKELENDİ]");

        console.error("Kitap arama hatası:", errorMessage);
        return NextResponse.json(
            { error: "Kitaplar aranırken bir hata oluştu" },
            { status: 500 }
        );
    }
}
