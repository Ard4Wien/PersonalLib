const DANGEROUS_TAGS = /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|button|select|link|meta|style|base|svg|math|template|applet|marquee|frame|frameset|video|audio|source|track)\b[^>]*>/gi;
const EVENT_HANDLERS = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
const DANGEROUS_URLS_GLOBAL = /(javascript|vbscript|data)\s*:/gi;
const DANGEROUS_URLS_TEST = /(javascript|vbscript|data)\s*:/i;
// Temel HTML etiketlerini temizle
const ALL_HTML_TAGS_GLOBAL = /<[^>]+>/g;
const ALL_HTML_TAGS_TEST = /<[^>]+>/;

// Tüm tagleri uçur
export function stripHtml(input: string): string {
    if (!input) return input;
    return input
        .replace(ALL_HTML_TAGS_GLOBAL, '')
        .replace(DANGEROUS_URLS_GLOBAL, '')
        .replace(EVENT_HANDLERS, '')
        .trim();
}

export function sanitizeHtml(input: string): string {
    if (!input) return input;
    return input
        .replace(DANGEROUS_TAGS, '')
        .replace(EVENT_HANDLERS, '')
        .replace(DANGEROUS_URLS_GLOBAL, '')
        .trim();
}

// URL güvenliği
export function isSafeUrl(url: string): boolean {
    if (!url) return true;
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:')) return false;
    if (trimmed.startsWith('vbscript:')) return false;
    if (trimmed.startsWith('data:')) return false;
    if (!trimmed.startsWith('https://')) return false;
    return true;
}
// HTML injection kontrolü
export function containsHtml(input: string): boolean {
    if (!input) return false;
    return ALL_HTML_TAGS_TEST.test(input) || DANGEROUS_URLS_TEST.test(input);
}
