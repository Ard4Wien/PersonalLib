import { z } from "zod";
import { isValidUsername, containsProfanity } from "./profanity";


export const registerSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    username: z
        .string()
        .min(4, "Kullanıcı adı en az 4 karakter olmalıdır")
        .max(10, "Kullanıcı adı en fazla 10 karakter olabilir")
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
        }),
    displayName: z
        .string()
        .min(2, "Görünen ad en az 2 karakter olmalıdır")
        .max(50, "Görünen ad en fazla 50 karakter olabilir")
        .regex(
            /^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]+$/,
            "Görünen ad sadece harf, rakam ve boşluk içerebilir"
        )
        .refine((val) => !/^\d+$/.test(val), {
            message: "Görünen ad sadece rakamlardan oluşamaz",
        })
        .refine((val) => !containsProfanity(val), {
            message: "Görünen ad uygunsuz içerik barındıramaz",
        }),
    password: z
        .string()
        .min(8, "Şifre en az 8 karakter olmalıdır")
        .max(100, "Şifre en fazla 100 karakter olabilir")
        .regex(
            /^(?=.*[a-zA-Z])(?=.*\d)/,
            "Şifre en az bir harf ve bir rakam içermelidir"
        ),
});

export const loginSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: z.string().min(1, "Şifre gereklidir"),
});

const imageSchema = z.string().url().optional().or(z.literal("")).refine((val) => {
    if (!val) return true;
    return val.startsWith("http://") || val.startsWith("https://");
}, {
    message: "Resim URL'i http veya https ile başlamalıdır"
});


export const bookSchema = z.object({
    title: z.string().min(1, "Kitap başlığı gereklidir"),
    author: z.string().optional(),
    coverImage: imageSchema,
    description: z.string().optional(),
    publishedYear: z.number().optional(),
    genre: z.string().optional(),
    pageCount: z.number().optional(),
    isbn: z.string().optional(),
});

export const movieSchema = z.object({
    title: z.string().min(1, "Film başlığı gereklidir"),
    director: z.string().optional(),
    coverImage: imageSchema,
    description: z.string().optional(),
    releaseYear: z.number().optional(),
    genre: z.string().optional(),
    duration: z.number().optional(),
    imdbId: z.string().optional(),
});

export const seriesSchema = z.object({
    title: z.string().min(1, "Dizi başlığı gereklidir"),
    creator: z.string().optional(),
    coverImage: imageSchema,
    description: z.string().optional(),
    startYear: z.number().optional(),
    endYear: z.number().optional(),
    genre: z.string().optional(),
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
            /^(?=.*[a-zA-Z])(?=.*\d)/,
            "Yeni şifre en az bir harf ve bir rakam içermelidir"
        ),
    confirmPassword: z.string().min(1, "Şifre onayı gereklidir"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler uyuşmuyor",
    path: ["confirmPassword"],
});


export const mediaStatusSchema = z.enum(
    ["READING", "WATCHING", "COMPLETED", "WISHLIST", "DROPPED"],
    { error: "Geçersiz durum değeri" }
);

export const ratingSchema = z.number().int().min(1, "Puan en az 1 olmalıdır").max(10, "Puan en fazla 10 olabilir").nullable();

export const notesSchema = z.string().max(5000, "Notlar en fazla 5000 karakter olabilir").optional();

export const bookUpdateSchema = z.object({
    userBookId: z.string().min(1),
    bookId: z.string().min(1),
    title: z.string().min(1, "Kitap başlığı gereklidir").max(500),
    author: z.string().max(500).optional(),
    coverImage: imageSchema,
    genre: z.string().max(200).optional(),
    status: mediaStatusSchema,
});

export const movieUpdateSchema = z.object({
    userMovieId: z.string().min(1),
    movieId: z.string().min(1),
    title: z.string().min(1, "Film başlığı gereklidir").max(500),
    director: z.string().max(500).optional(),
    coverImage: imageSchema,
    genre: z.string().max(200).optional(),
    status: mediaStatusSchema,
});

export const seriesUpdateSchema = z.object({
    userSeriesId: z.string().min(1),
    seriesId: z.string().min(1),
    title: z.string().min(1, "Dizi başlığı gereklidir").max(500),
    creator: z.string().max(500).optional(),
    coverImage: imageSchema,
    genre: z.string().max(200).optional(),
    totalSeasons: z.string().or(z.number()).optional(),
    status: mediaStatusSchema,
    lastSeason: z.string().or(z.number()).nullable().optional(),
    lastEpisode: z.string().or(z.number()).nullable().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type MovieInput = z.infer<typeof movieSchema>;
export type SeriesInput = z.infer<typeof seriesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
