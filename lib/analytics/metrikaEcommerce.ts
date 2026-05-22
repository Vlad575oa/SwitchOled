"use client";

import { hasAnalyticsConsent } from "@/lib/analytics/cookieConsent";

type AddToCartSource = "catalog_grid" | "product_page";

interface EcommerceProductInput {
  id: number | string;
  name: string;
  price: number;
  brand?: string;
  category?: string;
  variant?: string;
  quantity?: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function trackEcommerceAddToCart(product: EcommerceProductInput, source: AddToCartSource) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  const quantity = product.quantity && product.quantity > 0 ? product.quantity : 1;

  window.dataLayer = window.dataLayer || [];
  const event = {
    ecommerce: {
      currencyCode: "RUB",
      add: {
        products: [
          {
            id: String(product.id),
            name: product.name,
            price: product.price,
            quantity,
            brand: product.brand,
            category: product.category,
            variant: product.variant,
            list: source,
          },
        ],
      },
    },
  };
  window.dataLayer.push(event);

  if (process.env.NODE_ENV === "development") {
    console.log("[Metrika ecommerce] add_to_cart", event);
  }
}
