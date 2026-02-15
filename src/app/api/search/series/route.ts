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
            console.error("Dizi arama hatası: Yetkisiz");
            return NextResponse.json({ error: "Yetkisiz: Lütfen giriş yapın" }, { status: 401 });
        }

        const headers = {
            "Authorization": `Bearer ${TMDB_API_KEY}`,
            "Content-Type": "application/json"
        };

        if (!TMDB_API_KEY) {
            console.error("Dizi arama hatası: TMDB_API_KEY eksik");
            return NextResponse.json({ error: "TMDb API anahtarı yapılandırılmamış" }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json({ error: "Arama terimi gerekli" }, { status: 400 });
        }

        const OMDB_API_KEY = process.env.OMDB_API_KEY;


        const [tmdbResponse, tvmazeResponse, omdbResponse, jikanResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&language=tr-TR&include_adult=false`, { headers }).catch(() => null),
            fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`).catch(() => null),
            OMDB_API_KEY ? fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=series&apikey=${OMDB_API_KEY}`).catch(() => null) : null,
            fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`).catch(() => null)
        ]);

        let tmdbResults: any[] = [];
        let tvmazeResults: any[] = [];
        let omdbResults: any[] = [];
        let jikanResults: any[] = [];


        if (tmdbResponse?.ok) {
            const data = await tmdbResponse.json();
            tmdbResults = (data.results || []).map((show: any) => ({
                id: `tmdb-${show.id}`,
                title: show.name,
                startYear: show.first_air_date ? parseInt(show.first_air_date.substring(0, 4)) : undefined,
                coverImage: show.poster_path ? `https://image.tmdb.org/t/p/w780${show.poster_path}` : "",
                source: "tmdb"
            }));
        }


        if (tvmazeResponse?.ok) {
            const data = await tvmazeResponse.json();
            tvmazeResults = data.map((item: any) => {
                const show = item.show;
                return {
                    id: `tvm-${show.id}`,
                    title: show.name,
                    startYear: show.premiered ? parseInt(show.premiered.substring(0, 4)) : undefined,
                    coverImage: show.image?.original || show.image?.medium || "",
                    genre: show.genres?.[0] || "",
                    source: "tvmaze"
                };
            });
        }


        if (omdbResponse?.ok) {
            const data = await omdbResponse.json();
            if (data.Response === "True") {
                omdbResults = (data.Search || []).map((item: any) => ({
                    id: `omdb-${item.imdbID}`,
                    title: item.Title,
                    startYear: item.Year ? parseInt(item.Year.substring(0, 4)) : undefined,
                    coverImage: item.Poster !== "N/A" ? item.Poster : "",
                    source: "omdb"
                }));
            }
        }


        if (jikanResponse?.ok) {
            const data = await jikanResponse.json();
            jikanResults = (data.data || []).map((anime: any) => ({
                id: `mal-${anime.mal_id}`,
                title: anime.title,
                startYear: anime.year || (anime.aired?.from ? parseInt(anime.aired.from.substring(0, 4)) : undefined),
                coverImage: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "",
                genre: anime.genres?.[0]?.name || "",
                creator: anime.studios?.[0]?.name || "Bilinmiyor",
                totalSeasons: 1,
                source: "jikan"
            }));
        }


        const getScore = (item: any, query: string) => {
            let score = 0;
            const lowerQuery = query.toLowerCase().trim();
            const lowerTitle = item.title.toLowerCase();


            if (lowerTitle === lowerQuery) score += 20;
            else if (lowerTitle.startsWith(lowerQuery)) score += 10;
            else if (lowerTitle.includes(lowerQuery)) score += 5;


            if (item.coverImage) score += 10;
            if (item.creator && item.creator !== "Bilinmiyor") score += 5;
            if (item.genre && item.genre !== "") score += 3;
            if (item.totalSeasons && item.totalSeasons > 0) score += 3;
            if (item.startYear) score += 2;

            return score;
        };

        const topTMDB = tmdbResults.slice(0, 8);
        const topTVm = tvmazeResults.slice(0, 8);
        const topOMDb = omdbResults.slice(0, 8);


        const [detailedTMDB, detailedOMDb, detailedTVm] = await Promise.all([
            Promise.all(topTMDB.map(async (show: any) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                try {
                    const res = await fetch(`${TMDB_BASE_URL}/tv/${show.id.replace("tmdb-", "")}?language=tr-TR`, { headers, signal: controller.signal });
                    clearTimeout(timeout);
                    if (!res.ok) return show;
                    const details = await res.json();
                    return {
                        ...show,
                        creator: details.created_by?.[0]?.name || "Bilinmiyor",
                        genre: details.genres?.[0]?.name || "",
                        totalSeasons: details.number_of_seasons || 1
                    };
                } catch { clearTimeout(timeout); return show; }
            })),
            Promise.all(topOMDb.map(async (show: any) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                try {
                    const res = await fetch(`https://www.omdbapi.com/?i=${show.id.replace("omdb-", "")}&apikey=${OMDB_API_KEY}`, { signal: controller.signal });
                    clearTimeout(timeout);
                    if (!res.ok) return show;
                    const details = await res.json();
                    return {
                        ...show,
                        creator: details.Writer !== "N/A" ? details.Writer.split(",")[0] : "Bilinmiyor",
                        genre: details.Genre !== "N/A" ? details.Genre.split(",")[0] : "",
                        totalSeasons: Number(details.totalSeasons) || 1
                    };
                } catch { clearTimeout(timeout); return show; }
            })),
            Promise.all(topTVm.map(async (show: any) => {
                try {
                    const [crewRes, seasonsRes] = await Promise.all([
                        fetch(`https://api.tvmaze.com/shows/${show.id.replace("tvm-", "")}/crew`),
                        fetch(`https://api.tvmaze.com/shows/${show.id.replace("tvm-", "")}/seasons`)
                    ]);
                    let creator = "Bilinmiyor";
                    let totalSeasons = 1;
                    if (crewRes.ok) {
                        const crew = await crewRes.json();
                        creator = crew.find((c: any) => c.type === "Creator")?.person?.name ||
                            crew.find((c: any) => c.type === "Executive Producer")?.person?.name ||
                            "Bilinmiyor";
                    }
                    if (seasonsRes.ok) {
                        const seasons = await seasonsRes.json();
                        totalSeasons = Array.isArray(seasons) ? seasons.length : 1;
                    }
                    return { ...show, creator, totalSeasons };
                } catch { return show; }
            }))
        ]);


        const allResults = [...detailedTMDB, ...detailedTVm, ...detailedOMDb, ...jikanResults]
            .map(item => ({ ...item, score: getScore(item, query) }))
            .sort((a, b) => b.score - a.score);

        const cleanResults = allResults
            .map(({ score, ...item }) => ({
                ...item,
                subtitle: item.creator || "Bilinmiyor",
                creator: item.creator || "Bilinmiyor",
                image: item.coverImage,
                coverImage: item.coverImage,
                type: "series",
                genre: item.genre || "",
                totalSeasons: item.totalSeasons || 1
            }))
            .slice(0, 40); // slightly more results since we have more sources

        return NextResponse.json(cleanResults);
    } catch (error: any) {
        let errorMessage = error?.message || "Diziler aranırken bir hata oluştu";
        if (TMDB_API_KEY) errorMessage = errorMessage.replace(TMDB_API_KEY, "[MASKELENDİ]");
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_API_KEY) errorMessage = errorMessage.replace(OMDB_API_KEY, "[MASKELENDİ]");

        console.error("Dizi arama hatası:", errorMessage);
        return NextResponse.json(
            { error: "Diziler aranırken bir hata oluştu" },
            { status: 500 }
        );
    }
}
