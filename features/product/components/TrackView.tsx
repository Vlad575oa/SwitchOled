"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/features/product/hooks/useRecentlyViewed";
import { useSelectedVariantStore } from "@/features/product/store/useSelectedVariantStore";

export function TrackView({ productId }: { productId: number }) {
  const { addId } = useRecentlyViewed();
  const reset = useSelectedVariantStore((s) => s.reset);

  useEffect(() => {
    addId(productId);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
