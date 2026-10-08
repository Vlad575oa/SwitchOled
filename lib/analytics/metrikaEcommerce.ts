"use client";

import { hasAnalyticsConsent } from "@/lib/analytics/cookieConsent";

const METRIKA_ID = 108974800;

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
    ym?: ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
  }
}

function ymCall(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (typeof window.ym === "function") {
    window.ym(...args);
  } else {
    // Queue call for when Metrika loads
    window.ym = window.ym || Object.assign(function (...a: unknown[]) {
      (window.ym!.a = window.ym!.a || []).push(a);
    }, { a: [] as unknown[] });
    (window.ym.a = window.ym.a || []).push(args);
  }
}

export function trackMetrikaGoal(goal: string, params?: Record<string, unknown>) {
  if (!goal) return;
  if (params) {
    ymCall(METRIKA_ID, "reachGoal", goal, params);
  } else {
    ymCall(METRIKA_ID, "reachGoal", goal);
  }
}

interface PurchaseInput {
  orderId: string | number;
  items: EcommerceProductInput[];
  revenue: number; // in kopecks
}

export function trackEcommercePurchase({ orderId, items, revenue }: PurchaseInput) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  window.dataLayer = window.dataLayer || [];
  const event = {
    ecommerce: {
      currencyCode: "RUB",
      purchase: {
        actionField: {
          id: String(orderId),
          revenue: revenue / 100, // kopecks → rubles
        },
        products: items.map((p) => ({
          id: String(p.id),
          name: p.name,
          price: p.price / 100, // kopecks → rubles
          quantity: p.quantity ?? 1,
          brand: p.brand,
          category: p.category,
          variant: p.variant,
        })),
      },
    },
  };
  window.dataLayer.push(event);

  if (process.env.NODE_ENV === "development") {
    console.log("[Metrika ecommerce] purchase", event);
  }
}

export function trackEcommerceAddToCart(product: EcommerceProductInput, source: AddToCartSource) {
  if (typeof window === "undefined") return;

  // reachGoal fires regardless of ecommerce consent — used for goal counting
  trackMetrikaGoal("add_to_cart", {
    product_id: String(product.id),
    product_name: product.name,
    source,
  });

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
            price: product.price / 100, // kopecks → rubles
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
