

const BAD_WORDS = [
    "admin", "administrator", "moderator", "mod", "support", "yardim",
    "root", "sysadmin", "system",

    "kaka", "çiş", "porno", "porn", "p0rn", "seks", "sek", "sex", "s3x", "s3ks", "sik", "sapık", "sapik", "sık", "sikis", "sikiş", "s!k", "am", "amcık", "amcik"
];

// Kelime sınırı eşleşmesi için önceden derlenmiş regex kalıpları
const BAD_WORD_PATTERNS = BAD_WORDS.map(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zA-ZğüşöçıİĞÜŞÖÇ])${escaped}([^a-zA-ZğüşöçıİĞÜŞÖÇ]|$)`, 'i');
});

export function containsProfanity(text: string): boolean {
    if (!text) return false;

    return BAD_WORD_PATTERNS.some(pattern => pattern.test(text));
}

export function isValidUsername(text: string): boolean {
    if (containsProfanity(text)) return false;

    const RESERVED_WORDS = ["login", "register", "api", "dashboard", "settings", "profile"];
    if (RESERVED_WORDS.includes(text.toLowerCase())) return false;

    return true;
}
