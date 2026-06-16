const CATEGORY_REDIRECTS: Record<string, string> = {
  "/catalog/nintendo-switch": "/catalog/nintendo",
};

export function getCategoryRedirectTarget(pathname: string): string | null {
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.replace(/\/+$/, "") : pathname;

  return CATEGORY_REDIRECTS[normalizedPath] ?? null;
}
