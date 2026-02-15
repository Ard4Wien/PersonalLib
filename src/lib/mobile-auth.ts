import { verify } from "jsonwebtoken";

interface JWTPayload {
    userId: string;
    email: string;
    username: string;
}


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

        const decoded = verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JWTPayload;
        return decoded;
    } catch {
        return null;
    }
}


export async function getUserIdFromRequest(
    request: Request,
    auth: () => Promise<{ user?: { id?: string } } | null>
): Promise<string | null> {

    const session = await auth();
    if (session?.user?.id) {
        return session.user.id;
    }


    const authHeader = request.headers.get("Authorization");
    const tokenPayload = verifyMobileToken(authHeader);
    if (tokenPayload?.userId) {
        return tokenPayload.userId;
    }

    return null;
}
