import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/mobile-auth";

export const dynamic = 'force-dynamic';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request, auth);

        if (!userId) {
            console.error("Film arama hatası: Yetkisiz");
            return NextResponse.json({ error: "Yetkisiz: Lütfen giriş yapın" }, { status: 401 });
        }

        const headers = {
            "Authorization": `Bearer ${TMDB_API_KEY}`,
            "Content-Type": "application/json"
        };

        if (!TMDB_API_KEY) {
            console.error("Film arama hatası: TMDB_API_KEY eksik");
            return NextResponse.json({ error: "TMDb API anahtarı yapılandırılmamış" }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json({ error: "Arama terimi gerekli" }, { status: 400 });
        }

        const OMDB_API_KEY = process.env.OMDB_API_KEY;


        const [tmdbResponse, omdbResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=tr-TR&include_adult=false`, { headers }).catch(() => null),
            OMDB_API_KEY ? fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=${OMDB_API_KEY}`).catch(() => null) : null
        ]);

        let tmdbResults: any[] = [];
        let omdbResults: any[] = [];


        if (tmdbResponse?.ok) {
            const data = await tmdbResponse.json();
            tmdbResults = (data.results || []).map((movie: any) => ({
                id: `tmdb-${movie.id}`,
                title: movie.title,
                releaseYear: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : undefined,
                description: movie.overview || "",
                coverImage: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : "",
                source: "tmdb"
            }));
        }


        if (omdbResponse?.ok) {
            const data = await omdbResponse.json();
            if (data.Response === "True") {
                omdbResults = (data.Search || []).map((item: any) => ({
                    id: `omdb-${item.imdbID}`,
                    title: item.Title,
                    releaseYear: item.Year ? parseInt(item.Year.substring(0, 4)) : undefined,
                    coverImage: item.Poster !== "N/A" ? item.Poster : "",
                    source: "omdb"
                }));
            }
        }


        const getScore = (item: any, query: string) => {
            let score = 0;
            const lowerQuery = query.toLowerCase().trim();
            const lowerTitle = item.title.toLowerCase();


            if (lowerTitle === lowerQuery) score += 20;
            else if (lowerTitle.startsWith(lowerQuery)) score += 10;
            else if (lowerTitle.includes(lowerQuery)) score += 5;


            if (item.coverImage) score += 10;
            if (item.director && item.director !== "Bilinmiyor") score += 5;
            if (item.genre && item.genre !== "") score += 3;
            if (item.releaseYear) score += 2;

            return score;
        };

        const topTMDB = tmdbResults.slice(0, 10);
        const topOMDb = omdbResults.slice(0, 10);


        const fetchTMDBDetails = async (movie: any) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            try {
                const res = await fetch(`${TMDB_BASE_URL}/movie/${movie.id.replace("tmdb-", "")}?append_to_response=credits&language=tr-TR`, { headers, signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) return movie;
                const details = await res.json();
                return {
                    ...movie,
                    director: details.credits?.crew?.find((p: any) => p.job === "Director")?.name || "Bilinmiyor",
                    genre: details.genres?.[0]?.name || ""
                };
            } catch { clearTimeout(timeout); return movie; }
        };

        const fetchOMDbDetails = async (movie: any) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${movie.id.replace("omdb-", "")}&apikey=${OMDB_API_KEY}`, { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) return movie;
                const details = await res.json();
                return {
                    ...movie,
                    director: details.Director !== "N/A" ? details.Director : "Bilinmiyor",
                    genre: details.Genre !== "N/A" ? details.Genre.split(",")[0] : ""
                };
            } catch { clearTimeout(timeout); return movie; }
        };

        const [detailedTMDB, detailedOMDb] = await Promise.all([
            Promise.all(topTMDB.map(fetchTMDBDetails)),
            Promise.all(topOMDb.map(fetchOMDbDetails))
        ]);


        const allResults = [...detailedTMDB, ...detailedOMDb]
            .map(item => ({ ...item, score: getScore(item, query) }))
            .sort((a, b) => b.score - a.score);

        const cleanResults = allResults
            .map(({ score, ...item }) => ({
                ...item,
                subtitle: item.director || "Bilinmiyor",
                director: item.director || "Bilinmiyor",
                image: item.coverImage,
                coverImage: item.coverImage,
                type: "movie",
                genre: item.genre || ""
            }))
            .slice(0, 30);

        return NextResponse.json(cleanResults);
    } catch (error: any) {
        let errorMessage = error?.message || "Filmler aranırken bir hata oluştu";
        // Mask API keys in error logs
        if (TMDB_API_KEY) errorMessage = errorMessage.replace(TMDB_API_KEY, "[MASKELENDİ]");
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_API_KEY) errorMessage = errorMessage.replace(OMDB_API_KEY, "[MASKELENDİ]");

        console.error("Film arama hatası:", errorMessage);
        return NextResponse.json(
            { error: "Filmler aranırken bir hata oluştu" },
            { status: 500 }
        );
    }
}
