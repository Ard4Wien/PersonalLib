

const BAD_WORDS = [
    "admin", "administrator", "moderator", "mod", "support", "yardim",
    "root", "sysadmin", "system",

    "kaka", "çiş", "porno", "porn", "p0rn", "seks", "sek", "sex", "s3x", "s3ks", "sik", "sapık", "sapik", "sık", "sikis", "sikiş", "s!k", "am", "amcık", "amcik"
];

export function containsProfanity(text: string): boolean {
    if (!text) return false;

    const lowerText = text.toLowerCase();


    return BAD_WORDS.some(word => lowerText.includes(word));
}

export function isValidUsername(text: string): boolean {
    if (containsProfanity(text)) return false;


    const RESERVED_WORDS = ["login", "register", "api", "dashboard", "settings", "profile"];
    if (RESERVED_WORDS.includes(text.toLowerCase())) return false;

    return true;
}
