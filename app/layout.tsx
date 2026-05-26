import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { CONTACTS } from "@/lib/constants/contacts";
import dynamic from "next/dynamic";

const YandexMetrika = dynamic(() => import("@/components/YandexMetrika"), {
  ssr: false,
});
const MessengerExitNotice = dynamic(() => import("@/components/MessengerExitNotice"), {
  ssr: false,
});

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Gameshop24 | Магазин игровых консолей и аксессуаров",
    template: "%s | Gameshop24"
  },
  description: "Лучший выбор PlayStation, Xbox и Nintendo в России. Оригинальная продукция, официальная гарантия, быстрая доставка и лучшие цены на игровые приставки.",
  keywords: ["Nintendo Switch", "PlayStation 5", "Xbox Series X", "купить консоль", "игровой магазин", "Gameshop24"],
  authors: [{ name: "Gameshop24 Team" }],
  creator: "Gameshop24",
  publisher: "Gameshop24",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gameshop24 | Магазин игровых консолей",
    description: "Лучший выбор PlayStation, Xbox и Nintendo с доставкой по всей России.",
    url: baseUrl,
    siteName: "Gameshop24",
    locale: "ru_RU",
    type: "website",
    images: [{ url: `${baseUrl}/og-default.jpg`, width: 1200, height: 630, alt: "Gameshop24 — магазин игровых консолей" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gameshop24 | Магазин игровых консолей",
    description: "Лучший выбор PlayStation, Xbox и Nintendo с доставкой по всей России.",
    images: [`${baseUrl}/og-default.jpg`],
  },
  icons: {
    icon: "/favicon.svg?v=20260505",
    shortcut: "/favicon.svg?v=20260505",
    apple: "/favicon.svg?v=20260505",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "Gameshop24",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon.svg?v=20260505`,
        "width": 512,
        "height": 512,
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": CONTACTS.phoneDisplay,
        "contactType": "customer service",
        "hoursAvailable": "Mo-Su 10:00-21:00",
        "areaServed": "RU",
        "availableLanguage": "Russian",
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": CONTACTS.address,
        "addressLocality": CONTACTS.city,
        "postalCode": "125430",
        "addressCountry": "RU",
      },
      "sameAs": [
        "https://t.me/+79266763488",
        "https://wa.me/79266763488",
        CONTACTS.yandexBusinessUrl,
        CONTACTS.twoGisUrl,
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      "url": baseUrl,
      "name": "Gameshop24",
      "publisher": { "@id": `${baseUrl}/#organization` },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${baseUrl}/#localbusiness`,
      "name": "Gameshop24",
      "url": baseUrl,
      "telephone": CONTACTS.phoneDisplay,
      "priceRange": "₽₽₽",
      "image": `${baseUrl}/favicon.svg?v=20260505`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": CONTACTS.address,
        "addressLocality": CONTACTS.city,
        "addressCountry": "RU",
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        "opens": "10:00",
        "closes": "21:00",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 55.8428,
        "longitude": 37.3541,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="dns-prefetch" href="//mc.yandex.ru" />
        <link rel="icon" href="/favicon.svg?v=20260505" type="image/svg+xml" sizes="any" />
        <link rel="shortcut icon" href="/favicon.svg?v=20260505" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gameshop24" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#e8002d" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] antialiased min-h-screen">
        {children}
        <MessengerExitNotice />
        <YandexMetrika />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
