import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/profile/',
                '/books/',
                '/movies/',
                '/series/',
                '/settings/',
                '/wishlist/',
                '/reset-password/',
                '/forgot-password/',
            ],
        },
        sitemap: 'https://personal-lib.vercel.app/sitemap.xml',
    }
}
