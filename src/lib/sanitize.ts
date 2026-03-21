/**
 * HTML/XSS Sanitize Fonksiyonları
 * Metin girişlerinden zararlı HTML etiketlerini ve event handler'ları temizler.
 */

// Tehlikeli HTML etiketlerini temizle
const DANGEROUS_TAGS = /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|button|select|link|meta|style|base|svg|math|template|applet|marquee|frame|frameset|video|audio|source|track)\b[^>]*>/gi;

// Event handler'ları temizle (onclick, onerror, onload vb.)
const EVENT_HANDLERS = /\s*on\w+\s*=\s*["'][^"']*["']/gi;

// data: ve javascript: URL'lerini temizle
const DANGEROUS_URLS = /(javascript|vbscript|data)\s*:/gi;

// Temel HTML etiketlerini temizle (<div>, <span>, <a>, <img> vs.)
const ALL_HTML_TAGS = /<[^>]+>/g;

/**
 * Metinden tüm HTML etiketlerini kaldırır (Düz metin döndürür)
 */
export function stripHtml(input: string): string {
    if (!input) return input;
    return input
        .replace(ALL_HTML_TAGS, '')
        .replace(DANGEROUS_URLS, '')
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
        .replace(DANGEROUS_URLS, '')
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
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
    return true;
}

/**
 * Bir string içinde HTML injection riski taşıyan içerik var mı kontrol eder
 */
export function containsHtml(input: string): boolean {
    if (!input) return false;
    return ALL_HTML_TAGS.test(input) || DANGEROUS_URLS.test(input);
}
