const RESERVED_USERNAMES = [
    "admin", "administrator", "moderator", "mod", "support", "yardim", "destek",
    "root", "sysadmin", "system", "personallib",

    "login", "register", "api", "dashboard", "settings", "profile", "portfolio",
    "auth", "reset-password", "forgot-password", "search"
];

// küfür filt
const PROFANITY_LIST = [
    "porno", "porn", "p0rn", "pornoo", "p0rn0", "prno", "pornp", "pornhub", "p0rnhub", "pornohub", "prnhub",
    "seks", "sex", "s3x", "s3ks", "sekss", "s€ks", "s€x", "seksy", "seksi", "sexxy", "s3ksi", "sex shop", "sexshop",
    "sik", "s!k", "s1k", "sık", "siiik", "s1k1", "s!k1", "sk", "sikk", "s!kk", "sıkt", "s!kt", "5ik", "sikc",
    "sikis", "sikiş", "s1k1s", "s!k!s", "sikiss", "sikişş", "sıkıs", "s1kıs", "s!kıs", "sks", "siks", "s1k1s1k", "sik sik",
    "am", "4m", "amk", "amına", "amina", "a.m", "a.q", "aq", "amq", "amk", "amına koyayım", "amına koyim", "amına koy", "amkoy",
    "amcık", "amcik", "amc1k", "4mcık", "amcıq", "amçık", "amç1k", "amcikk", "amc1kk", "amcikc", "amg", "amc", "amcığı", "amc1gı", "amcıklar",
    "göt", "got", "g0t", "götü", "gotu", "g0tu", "göt deligi", "got deligi", "g0t d3l1g1", "göt deliği", "gotdeligi", "götünü", "göt delik", "götünü s",
    "orospu", "orospu çocuğu", "orospu cocugu", "0rospu", "or0spu", "orospuçocuğu", "orospu ç", "orosbu", "orospuç", "orspu", "or0spuç", "orospunun", "orospu çoc", "orospu kızı", "orospu evladı",
    "piç", "pic", "p!ç", "p1ç", "piç kurusu", "pic kurusu", "pıç", "p1c", "piçç", "piçk", "piçlik", "piç kurusu", "piç oğlu piç",
    "ibne", "ibnê", "1bne", "i bne", "ibine", "ibneye", "ibneler", "1bneler", "ibn0", "ibno", "ibneye", "ibnelik",
    "pezevenk", "pezzevenk", "pezeveng", "p3zevenk", "pezev", "pezv", "gavat", "kavat", "g4v4t", "k4v4t", "gav4t", "kav4t", "gavatlık", "pezevenklik",
    "yavşak", "yavsak", "y4vş4k", "yavş", "yavşak herif", "yavşakk", "y4vşakk", "yavshak", "yavşamak",
    "şerefsiz", "serefsiz", "şerefsız", "serefsiz", "şrfsz", "serefsız", "şerefsiz piç", "srfsz", "şerefsizlik",
    "kahpe", "k4hp3", "kahbe", "kahpe dölü", "kahp", "k4hp", "kahpee", "kahpe dölü",
    "kaltak", "kaltakk", "k4lt4k", "kalt4k", "kaltakkk",
    "sürtük", "surtuk", "sürtük", "s3rt3k", "surtukk", "s3rtukk",
    "dalyarrak", "dal yarrak", "dalyarak", "d4ly4rr4k", "dalyarrakk",
    "götveren", "gotveren", "göt verici", "g0tv3r3n", "gotv3r3n", "götv",
    "sikik", "s1k1k", "sikkk", "s!k!k", "s1kk1k", "sikikk", "sikik herif",
    "bok", "b0k", "boktan", "b*k", "bok çuvalı", "bokcu", "b0kcu", "bokkk", "bok gibi", "boktan iş",
    "salak", "s4l4k", "salakk", "aptal", "apt4l", "gerizekalı", "gerizekali", "grzkl", "gerz", "gerzek", "gerzek herif", "aptal herif",
    "mal", "m4l", "malın malı", "malll", "mallar", "m4ll", "mal mal", "mallık",
    "lavuk", "l4vuk", "lavuk herif", "lavukk",
    "dönme", "d0nme", "dönm0", "donme",
    "otuzbirci", "31ci", "otuzbircı", "31", "otuz bir", "otuzbır", "31c1", "otuzbir", "otuzbirek",
    "kaçık", "kacik", "k4ç1k", "kacikk",
    "terbiyesiz", "terbiyesız", "terbiyesiz piç", "trbysz",
    "sapık", "sapik", "s4p1k", "sap1k", "sapikk", "s4pikk", "sapık herif",
    "tecavüz", "tecavuz", "t3c4vuz", "tecavvuz", "t3cavuz", "tecavüzcü", "tecavüz etmek",
    "tecavüzcü", "t3c4vuzcu", "tecavvuzcu",
    "fahişe", "fahise", "f4h1ş3", "fuhuş", "fahiselik", "f4hise", "fuhş",
    "kaşar", "kasar", "k4ş4r", "kaşarr", "kasarr", "k4s4r", "kaşar kız",
    "yarrak", "yarrrak", "y4rr4k", "yarram", "yarr", "y4r4k", "yarra", "yarrakk", "yarrraaak", "y4rrr4k", "yarrk", "yarramı", "yarrak başı",
    "taşşak", "tassak", "t4şş4k", "taşak", "döşşak", "taşşakk", "tassakk", "t4ss4k", "task", "taşak geçmek",
    "amına kodum", "amina kodum", "amına koduğum", "aq kodum", "amk kodum", "amına koyduğum", "amkoydugum",
    "sikeyim", "s!keyim", "s1keyim", "sikeyim seni", "skeym", "s1k3y1m", "s!k3y!m", "sikeyim belanı",
    "siktir", "s!ktir", "siktir git", "sktr", "s1kt1r", "siktirr", "siktirrr", "sktir", "s!kt!r", "siktir lan",
    "sikerim", "s!kerim", "s1kerim", "sikerim belanı", "skerim", "s1k3r1m",
    "ananı", "ananı sikerim", "anan", "ananı s", "4n4n1", "ananın amı", "ananın", "ananıskm", "anan sikeyim", "ananın amına",
    "annen", "annenin amı", "annenin", "4nn3n", "anneni s", "annenis", "anneni sikerim",
    "babanı", "babanın amı", "b4b4n1", "babanıs", "babanı s",
    "kızına", "kızına koyayım", "k1z1n4", "kızına koy", "kızını s",
    "eşek", "esek", "eşşek", "e$ek", "esshek", "eşşoğlueşşek",
    "it", "it oğlu it", "1t", "itoglu", "it oğlan",
    "köpek", "kopek", "köp3k", "k0pek", "köpek dölü",
    "domuz", "domuz", "d0muz", "domuzzz", "domuz gibi",
    "oğlan", "oglan", "o.ç", "oc", "oğlancı", "oglanci",
    "siklesene", "s!klesene", "s1klesene", "sklesene",
    "sikdir", "s!kdir", "sikdir git", "skdr",
    "amına koyacağım", "amina koyacagim", "amkycm",
    "orospunun", "orospunun cocugu", "orospun",
    "piçliğin", "picligin", "p!çl1g1n",
    "sikimin", "s!k1m1n", "s1k1m1n", "skmn", "sikimin başı",
    "amımın", "4m1m1n", "am1m1n",
    "götünün", "gotunun", "g0tunun",
    "yarramın", "y4rr4m1n", "yarramin",
    "çocuk pornosu", "cocuk pornosu", "cp", "child porn", "cocukporno", "cocuk por",
    "tecavüz pornosu", "rape", "ırza geçme", "ırza", "ırz",
    "uyuşturucu", "uyusturucu", "k4k41n", "kokain", "esrar", "marijuana", "eroin", "met", "metamfetamin",
    "pedofili", "pedofil", "cocuk sevic", "çocuk seven", "çocuk istismarı",
    "tecavüzcü piç", "tecavüzcü orospu çocuğu"
];

// Kelime sınırı eşleşmesi için önceden derlenmiş regex kalıpları
const PROFANITY_PATTERNS = PROFANITY_LIST.map(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zA-ZğüşöçıİĞÜŞÖÇ])${escaped}([^a-zA-ZğüşöçıİĞÜŞÖÇ]|$)`, 'i');
});


// Genel küfür kontrolü

export function containsProfanity(text: string): boolean {
    if (!text) return false;
    return PROFANITY_PATTERNS.some(pattern => pattern.test(text));
}


// Rezerve isim ve küfür kontrolü

export function isValidUsername(text: string): boolean {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    if (containsProfanity(lowerText)) return false;
    if (RESERVED_USERNAMES.includes(lowerText)) return false;

    return true;
}
