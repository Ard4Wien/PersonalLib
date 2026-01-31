import { verify } from "jsonwebtoken";

interface JWTPayload {
    userId: string;
    email: string;
    username: string;
}

/**
 * Mobil uygulamadan gelen JWT token'ı doğrular.
 * Başarılı olursa kullanıcı bilgilerini döndürür, aksi halde null döner.
 */
export function verifyMobileToken(authHeader: string | null): JWTPayload | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

    if (!JWT_SECRET) {
        console.error("JWT_SECRET or AUTH_SECRET is not defined");
        return null;
    }

    try {
        // Algoritma zorunlu kılındı: HS256
        const decoded = verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JWTPayload;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Request'ten kullanıcı ID'sini alır.
 * Önce session kontrol eder (web), yoksa JWT token kontrol eder (mobil).
 */
export async function getUserIdFromRequest(
    request: Request,
    auth: () => Promise<{ user?: { id?: string } } | null>
): Promise<string | null> {
    // 1. Session kontrolü (web için)
    const session = await auth();
    if (session?.user?.id) {
        return session.user.id;
    }

    // 2. JWT token kontrolü (mobil için)
    const authHeader = request.headers.get("Authorization");
    const tokenPayload = verifyMobileToken(authHeader);
    if (tokenPayload?.userId) {
        return tokenPayload.userId;
    }

    return null;
}
