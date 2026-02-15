import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PersonalLib - Kişisel Medya Kütüphanesi",
  description: "Kitaplarınızı, filmlerinizi ve dizilerinizi takip edin. Kendi medya arşivinizi oluşturun ve paylaşın.",
  keywords: ["personal library", "kişisel kütüphane", "kitap takibi", "film arşivi", "dizi takibi", "media tracker", "okuma listesi"],
  authors: [{ name: "PersonalLib Team" }],
  metadataBase: new URL("https://personal-lib.vercel.app"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "FazKHNpurwfHLXERte0WuCLfyBF0K0nFwjrVIqU7vSE",
  },
  openGraph: {
    title: "PersonalLib - Kişisel Medya Kütüphanesi",
    description: "Kitaplarınızı, filmlerinizi ve dizilerinizi takip edin. Kendi medya arşivinizi oluşturun.",
    url: "https://personal-lib.vercel.app",
    siteName: "PersonalLib",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PersonalLib - Kişisel Medya Kütüphanesi",
    description: "Kitaplarınızı, filmlerinizi ve dizilerinizi takip edin.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden w-full`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "PersonalLib",
              "operatingSystem": "Web",
              "applicationCategory": "LifestyleApplication",
              "description": "Kitaplarınızı, filmlerinizi ve dizilerinizi takip edin. Kendi medya arşivinizi oluşturun.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
