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

        if (!TMDB_API_KEY) {
            console.error("Film arama hatası: TMDB_API_KEY eksik");
            return NextResponse.json({ error: "TMDb API anahtarı yapılandırılmamış" }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json({ error: "Arama terimi gerekli" }, { status: 400 });
        }

        if (query.length > 100) {
            return NextResponse.json({ error: "Arama terimi çok uzun" }, { status: 400 });
        }

        const OMDB_API_KEY = process.env.OMDB_API_KEY;


        const [tmdbResponse, omdbResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=tr-TR&include_adult=false`).catch(() => null),
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

        // film sınırlama
        const topTMDB = tmdbResults.slice(0, 5);
        const topOMDb = omdbResults.slice(0, 5);


        const fetchTMDBDetails = async (movie: any) => {
            try {
                const res = await fetch(`${TMDB_BASE_URL}/movie/${movie.id.replace("tmdb-", "")}?api_key=${TMDB_API_KEY}&append_to_response=credits&language=tr-TR`);
                if (!res.ok) return movie;
                const details = await res.json();

                let description = details.overview || movie.description;

                // tr yoksa en dene
                if (!description && TMDB_API_KEY) {
                    try {
                        const enRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id.replace("tmdb-", "")}?api_key=${TMDB_API_KEY}&language=en-US`);
                        if (enRes.ok) {
                            const enData = await enRes.json();
                            description = enData.overview || "";
                        }
                    } catch (e) { }
                }

                return {
                    ...movie,
                    description,
                    director: details.credits?.crew?.find((p: any) => p.job === "Director")?.name || "Bilinmiyor",
                    genre: details.genres?.[0]?.name || ""
                };
            } catch { return movie; }
        };

        const fetchOMDbDetails = async (movie: any) => {
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${movie.id.replace("omdb-", "")}&apikey=${OMDB_API_KEY}`);
                if (!res.ok) return movie;
                const details = await res.json();
                return {
                    ...movie,
                    director: details.Director !== "N/A" ? details.Director : "Bilinmiyor",
                    genre: details.Genre !== "N/A" ? details.Genre.split(",")[0] : ""
                };
            } catch { return movie; }
        };

        const [detailedTMDB, detailedOMDb] = await Promise.all([
            Promise.all(topTMDB.map(fetchTMDBDetails)),
            Promise.all(topOMDb.map(fetchOMDbDetails))
        ]);


        const allResults = [...detailedTMDB, ...detailedOMDb]
            .map(item => ({ ...item, score: getScore(item, query) }))
            .sort((a, b) => b.score - a.score);

        // Kapak resmi filtresi
        const cleanResults = allResults
            .map(({ score, ...item }) => ({
                ...item,
                subtitle: item.director || "Bilinmiyor",
                image: item.coverImage,
                type: "movie"
            }))
            .slice(0, 30);

        return NextResponse.json(cleanResults);
    } catch {
        console.error("movie search fail");
        return NextResponse.json(
            { error: "Arama şu an yapılamıyor, lütfen sonra tekrar dene." },
            { status: 500 }
        );
    }
}
