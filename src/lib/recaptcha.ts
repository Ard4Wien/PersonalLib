export async function validateRecaptcha(token: string) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        // Geliştirme aşamasında anahtar yoksa doğrulamayı atla
        console.warn("RECAPTCHA_SECRET_KEY tanımlı değil. Doğrulama atlanıyor.");
        return true;
    }

    if (!token) return false;

    try {
        const response = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
            }
        );

        const outcome = await response.json();
        
        // v3 için score kontrolü de (0.5 ve üzeri genelde güvenli kabul edilir)
        // Eğer v2 kullanılıyorsa sadece outcome.success yeterlidir
        return outcome.success && (outcome.score === undefined || outcome.score >= 0.5);
    } catch (error) {
        console.error("reCaptcha doğrulama hatası");
        return false;
    }
}
