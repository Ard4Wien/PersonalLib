export async function validateTurnstile(token: string) {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
        // Geliştirme aşamasında anahtar yoksa doğrulamayı atla
        console.warn("TURNSTILE_SECRET_KEY tanımlı değil. Doğrulama atlanıyor.");
        return true;
    }

    if (!token) return false;

    try {
        const response = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
            }
        );

        const outcome = await response.json();
        return outcome.success;
    } catch (error) {
        console.error("Turnstile doğrulama hatası");
        return false;
    }
}
