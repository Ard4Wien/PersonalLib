import { z } from "zod";
import { isValidUsername, containsProfanity } from "./profanity";
import { containsHtml } from "./sanitize";

export const usernameSchema = z
    .string()
    .min(4, "Kullanıcı adı en az 4 karakter olmalıdır")
    .max(12, "Kullanıcı adı en fazla 12 karakter olabilir")
    .regex(
        /^[a-z0-9_]+$/,
        "Kullanıcı adı sadece küçük harf, rakam ve alt çizgi içerebilir"
    )
    .transform((val) => val.toLowerCase())
    .refine((val) => !/^\d+$/.test(val), {
        message: "Kullanıcı adı sadece rakamlardan oluşamaz",
    })
    .refine((val) => isValidUsername(val), {
        message: "Bu kullanıcı adı kullanılamaz veya uygunsuz içerik barındırıyor",
    });

export const passwordSchema = z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .max(100, "Şifre en fazla 100 karakter olabilir")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/,
        "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir"
    );

export const registerSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    username: usernameSchema,
    displayName: z
        .string()
        .min(2, "Görünen ad en az 2 karakter olmalıdır")
        .max(50, "Görünen ad en fazla 50 karakter olabilir")
        .regex(
            /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
            "Görünen ad sadece harf ve boşluk içerebilir"
        )
        .refine((val) => !/^\d+$/.test(val), {
            message: "Görünen ad sadece rakamlardan oluşamaz",
        })
        .refine((val) => !containsProfanity(val), {
            message: "Görünen ad uygunsuz içerik barındıramaz",
        }),
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: z.string().min(1, "Şifre gereklidir"),
});

const imageSchema = z.string().url().optional().or(z.literal("")).refine((val) => {
    if (!val) return true;
    // Güvenlik: Tehlikeli protokolleri kesinlikle engelle (defense-in-depth)
    const lower = val.toLowerCase().trim();
    if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) return false;
    // Sadece HTTPS kabul et
    return lower.startsWith("https://");
}, {
    message: "Resim Desteklenmiyor"
}).refine((val) => {
    if (!val) return true;
    return val.length <= 2000;
}, {
    message: "URL çok uzun"
});


export const bookSchema = z.object({
    title: z.string().min(1, "Kitap başlığı gereklidir").max(500, "Başlık çok uzun").refine((val) => !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    author: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    coverImage: imageSchema,
    description: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    publishedYear: z.number().optional(),
    genre: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    pageCount: z.number().optional(),
    isbn: z.string().optional(),
});

export const movieSchema = z.object({
    title: z.string().min(1, "Film başlığı gereklidir").max(500, "Başlık çok uzun").refine((val) => !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    director: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    coverImage: imageSchema,
    description: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    releaseYear: z.number().optional(),
    genre: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    duration: z.number().optional(),
    imdbId: z.string().optional(),
});

export const seriesSchema = z.object({
    title: z.string().min(1, "Dizi başlığı gereklidir").max(500, "Başlık çok uzun").refine((val) => !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    creator: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    coverImage: imageSchema,
    description: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    startYear: z.number().optional(),
    endYear: z.number().optional(),
    genre: z.string().optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }).refine((val) => !val || !containsHtml(val), {
        message: "HTML içerik kullanılamaz",
    }),
    totalSeasons: z.number().min(1).default(1),
    imdbId: z.string().optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
    newPassword: z
        .string()
        .min(8, "Yeni şifre en az 8 karakter olmalıdır")
        .max(100, "Yeni şifre en fazla 100 karakter olabilir")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/,
            "Yeni şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir"
        ),
    confirmPassword: z.string().min(1, "Şifre onayı gereklidir"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler uyuşmuyor",
    path: ["confirmPassword"],
}).refine((data) => data.newPassword !== data.currentPassword, {
    message: "Yeni şifre mevcut şifre ile aynı olamaz",
    path: ["newPassword"],
});


export const mediaStatusSchema = z.enum(
    ["READING", "WATCHING", "COMPLETED", "WISHLIST", "DROPPED"],
    { error: "Geçersiz durum değeri" }
);

export const bookUpdateSchema = z.object({
    userBookId: z.string().min(1),
    bookId: z.string().min(1),
    title: z.string().min(1, "Kitap başlığı gereklidir").max(500).refine((val) => !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    author: z.string().max(500).optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    coverImage: imageSchema,
    genre: z.string().max(200).optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    status: mediaStatusSchema,
});

export const movieUpdateSchema = z.object({
    userMovieId: z.string().min(1),
    movieId: z.string().min(1),
    title: z.string().min(1, "Film başlığı gereklidir").max(500).refine((val) => !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    director: z.string().max(500).optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    coverImage: imageSchema,
    genre: z.string().max(200).optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    status: mediaStatusSchema,
});

export const seriesUpdateSchema = z.object({
    userSeriesId: z.string().min(1),
    seriesId: z.string().min(1),
    title: z.string().min(1, "Dizi başlığı gereklidir").max(500).refine((val) => !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    creator: z.string().max(500).optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    coverImage: imageSchema,
    genre: z.string().max(200).optional().refine((val) => !val || !containsProfanity(val), {
        message: "İçerik uygunsuz kelimeler barındırıyor",
    }),
    totalSeasons: z.coerce.number().int().positive("Geçersiz sezon sayısı").optional(),
    status: mediaStatusSchema,
    lastSeason: z.coerce.number().int().min(1).nullable().optional(),
    lastEpisode: z.coerce.number().int().min(1).nullable().optional(),
});

export const mediaPatchSchema = z.object({
    status: mediaStatusSchema.optional(),
    isFavorite: z.boolean().optional(),
});

export const bookPatchSchema = mediaPatchSchema.extend({
    userBookId: z.string().min(1),
});

export const moviePatchSchema = mediaPatchSchema.extend({
    userMovieId: z.string().min(1),
});

export const seriesPatchSchema = mediaPatchSchema.extend({
    userSeriesId: z.string().min(1),
    lastSeason: z.coerce.number().int().min(1).nullable().optional(),
    lastEpisode: z.coerce.number().int().min(1).nullable().optional(),
    seasonId: z.string().optional(),
    seasonStatus: mediaStatusSchema.optional(),
});

export const languageSchema = z.enum(["tr", "en", "fr", "de", "ru", "zh", "ja"]);

export const privacySchema = z.object({
    isPrivate: z.boolean()
});

export const profileImageSchema = z.string().min(1, "Resim yolu gereklidir").max(500, "Resim yolu çok uzun").refine((val) => {
    // HTTPS URL'leri sadece kendi alan adımızsa kabul et
    if (val.startsWith("https://")) {
        return val.startsWith("https://qyeexaciulccipypubdt.supabase.co");
    }

    // Path Traversal koruması: "..", "//", "\\" karakterlerini engelle
    if (val.includes("..") || val.includes("//") || val.includes("\\")) return false;

    // Sadece avatars/ altında ve güvenli dosya uzantılarıyla kabul et
    return /^avatars\/[a-zA-Z0-9@!_-]+\.(jpg|jpeg|png|webp)$/i.test(val);
}, {
    message: "Geçersiz veya yetkisiz resim formatı"
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type MovieInput = z.infer<typeof movieSchema>;
export type SeriesInput = z.infer<typeof seriesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type BookPatchInput = z.infer<typeof bookPatchSchema>;
export type MoviePatchInput = z.infer<typeof moviePatchSchema>;
export type SeriesPatchInput = z.infer<typeof seriesPatchSchema>;
