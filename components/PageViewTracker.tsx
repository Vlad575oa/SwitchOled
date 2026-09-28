"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageViewTracker({ productId }: { productId?: number }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    fetch("/api/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageType: productId ? "product" : "home", path: pathname, ...(productId ? { productId } : {}) }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, productId]);
  return null;
}
