import { z } from "zod";
import { isValidUsername, containsProfanity } from "./profanity";

// Auth şemaları
export const registerSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    username: z
        .string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
        .max(20, "Kullanıcı adı en fazla 20 karakter olabilir")
        .regex(
            /^[a-z0-9_]+$/,
            "Kullanıcı adı sadece küçük harf, rakam ve alt çizgi içerebilir"
        )
        .transform((val) => val.toLowerCase())
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
}).refine((val) => {
    if (!val) return true;
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(val);
}, {
    message: "URL geçerli bir resim uzantısıyla bitmelidir (jpg, jpeg, png, webp, gif)"
});

// İçerik şemaları
export const bookSchema = z.object({
    title: z.string().min(1, "Kitap başlığı gereklidir"),
    author: z.string().min(1, "Yazar adı gereklidir"),
    coverImage: imageSchema,
    description: z.string().optional(),
    publishedYear: z.number().optional(),
    genre: z.string().optional(),
    pageCount: z.number().optional(),
    isbn: z.string().optional(),
});

export const movieSchema = z.object({
    title: z.string().min(1, "Film başlığı gereklidir"),
    director: z.string().min(1, "Yönetmen adı gereklidir"),
    coverImage: imageSchema,
    description: z.string().optional(),
    releaseYear: z.number().optional(),
    genre: z.string().optional(),
    duration: z.number().optional(),
    imdbId: z.string().optional(),
});

export const seriesSchema = z.object({
    title: z.string().min(1, "Dizi başlığı gereklidir"),
    creator: z.string().min(1, "Yapımcı adı gereklidir"),
    coverImage: imageSchema,
    description: z.string().optional(),
    startYear: z.number().optional(),
    endYear: z.number().optional(),
    genre: z.string().optional(),
    totalSeasons: z.number().min(1).default(1),
    imdbId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type MovieInput = z.infer<typeof movieSchema>;
export type SeriesInput = z.infer<typeof seriesSchema>;
