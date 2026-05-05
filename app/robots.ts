import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/auth",
          "/success",
          "/company",
          "/info",
          "/license",
          "/policy",
          "/catalog/mashini_motocikli_tehnika-17",
          "/catalog/lego-11",
          "/*?*", // Disallow query parameters for SEO
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
