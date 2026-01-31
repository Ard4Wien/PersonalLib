import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/profile/'],
        },
        sitemap: 'https://personal-lib.vercel.app/sitemap.xml',
    }
}
