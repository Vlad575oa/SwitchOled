const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru").replace("://www.", "://");

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /auth",
    "Disallow: /success",
    "Disallow: /company",
    "Disallow: /info",
    "Disallow: /license",
    "Disallow: /catalog/mashini_motocikli_tehnika-17",
    "Disallow: /catalog/lego-11",
    "Disallow: /*copy*",
    "Clean-param: from&ref&source",
    "Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content&utm_id",
    "Clean-param: yclid&yclid_source&ymclid&fbclid&gclid",
    "",
    "User-agent: GPTBot",
    "Disallow: /",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
