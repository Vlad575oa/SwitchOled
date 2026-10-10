"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type PageType = "home" | "product" | "article";

export function PageViewTracker({ productId, pageType }: { productId?: number; pageType?: PageType }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const resolvedPageType = pageType ?? (productId ? "product" : "home");
    fetch("/api/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageType: resolvedPageType, path: pathname, ...(productId ? { productId } : {}) }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, pageType, productId]);
  return null;
}
