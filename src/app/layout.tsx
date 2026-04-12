import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/providers";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PersonalLib – Personal Library | Kişisel Medya Kütüphanesi",
  description: "PersonalLib is your free personal library to track books, movies and TV series. Build your media collection, create wishlists and share your portfolio. | Kitaplarınızı, filmlerinizi ve dizilerinizi takip edin. Kendi medya arşivinizi oluşturun ve paylaşın.",
  keywords: ["personal lib", "personal library", "personallib", "book tracker", "movie tracker", "series tracker", "media library", "free personal library", "kişisel kütüphane", "kitap takibi", "film arşivi", "dizi takibi", "medya kütüphanesi", "okuma listesi", "izleme listesi"],
  authors: [{ name: "PersonalLib Team" }],
  metadataBase: new URL("https://personal-lib.vercel.app"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "FazKHNpurwfHLXERte0WuCLfyBF0K0nFwjrVIqU7vSE",
  },
  openGraph: {
    title: "PersonalLib – Personal Library | Kişisel Medya Kütüphanesi",
    description: "Track your books, movies and TV series in one place. Create your personal media collection and share your portfolio. | Kitaplarınızı, filmlerinizi ve dizilerinizi takip edin.",
    url: "https://personal-lib.vercel.app",
    siteName: "PersonalLib",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PersonalLib – Personal Library | Kişisel Kütüphane",
    description: "Track books, movies & series. Build your personal media library. | Kitap, film ve dizi takip uygulaması.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const headersList = await headers();
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'tr';
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden w-full`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "PersonalLib",
              "alternateName": ["Personal Lib", "Personal Library"],
              "url": "https://personal-lib.vercel.app",
              "operatingSystem": "Web",
              "applicationCategory": "LifestyleApplication",
              "description": "Free personal library to track books, movies and TV series. Build your media collection and share your portfolio.",
              "inLanguage": ["tr", "en"],
              "featureList": "Book Tracking, Movie Tracking, Series Tracking, Wishlist, Shareable Portfolio, Multi-language Support",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "50",
                "bestRating": "5"
              }
            })
          }}
        />
        <Providers session={session} nonce={nonce}>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
