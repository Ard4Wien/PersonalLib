/**
 * HTML/XSS Sanitize Fonksiyonları
 * Metin girişlerinden zararlı HTML etiketlerini ve event handler'ları temizler.
 */

// Tehlikeli HTML etiketlerini temizle
const DANGEROUS_TAGS = /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|button|select|link|meta|style|base|svg|math|template|applet|marquee|frame|frameset|video|audio|source|track)\b[^>]*>/gi;

// Event handler'ları temizle (onclick, onerror, onload vb.)
const EVENT_HANDLERS = /\s*on\w+\s*=\s*["'][^"']*["']/gi;

// data: ve javascript: URL'lerini temizle
// NOT: Aşağıdaki regex'ler iki farklı amaçla kullanılıyor:
// - Global (g) flagli olanlar: replace() içinde tüm eşleşmeleri temizlemek için
// - Global flagsiz olanlar: test() içinde stateful lastIndex bug'ından kaçınmak için
const DANGEROUS_URLS_GLOBAL = /(javascript|vbscript|data)\s*:/gi;
const DANGEROUS_URLS_TEST = /(javascript|vbscript|data)\s*:/i;

// Temel HTML etiketlerini temizle (<div>, <span>, <a>, <img> vs.)
const ALL_HTML_TAGS_GLOBAL = /<[^>]+>/g;
const ALL_HTML_TAGS_TEST = /<[^>]+>/;

/**
 * Metinden tüm HTML etiketlerini kaldırır (Düz metin döndürür)
 */
export function stripHtml(input: string): string {
    if (!input) return input;
    return input
        .replace(ALL_HTML_TAGS_GLOBAL, '')
        .replace(DANGEROUS_URLS_GLOBAL, '')
        .replace(EVENT_HANDLERS, '')
        .trim();
}

/**
 * Tehlikeli HTML etiketlerini ve event handler'ları kaldırır
 * Güvenli etiketlere (b, i, em, strong) dokunmaz
 */
export function sanitizeHtml(input: string): string {
    if (!input) return input;
    return input
        .replace(DANGEROUS_TAGS, '')
        .replace(EVENT_HANDLERS, '')
        .replace(DANGEROUS_URLS_GLOBAL, '')
        .trim();
}

/**
 * URL'nin güvenli olup olmadığını kontrol eder
 */
export function isSafeUrl(url: string): boolean {
    if (!url) return true;
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:')) return false;
    if (trimmed.startsWith('vbscript:')) return false;
    if (trimmed.startsWith('data:')) return false;
    // Güvenlik politikası gereği sadece HTTPS kabul edilir
    if (!trimmed.startsWith('https://')) return false;
    return true;
}

/**
 * Bir string içinde HTML injection riski taşıyan içerik var mı kontrol eder
 */
export function containsHtml(input: string): boolean {
    if (!input) return false;
    // Global flag'siz regex kullanarak stateful lastIndex bug'ından kaçınılır
    return ALL_HTML_TAGS_TEST.test(input) || DANGEROUS_URLS_TEST.test(input);
}
