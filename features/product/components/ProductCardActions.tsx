"use client";

import { ShoppingCart, Heart, Scale } from "lucide-react";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useWishlistStore } from "@/features/product/store/useWishlistStore";
import { useCompareStore } from "@/features/product/store/useCompareStore";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { trackEcommerceAddToCart } from "@/lib/analytics/metrikaEcommerce";
import { cn } from "@/lib/utils";
import { QuickOrderModal } from "./QuickOrderModal";

interface ProductCardActionsProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    images: string[];
    inStock?: boolean;
  };
}

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const hydrated = useHydrated();
  const inWishlist = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inCompare = useCompareStore((s) => s.has(product.id));
  const compareFull = useCompareStore((s) => s.isFull());
  const toggleCompare = useCompareStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.addItem);

  const notifyAddedToCart = async () => {
    const { toast } = await import("sonner");
    toast.success("Добавлено в корзину", { description: product.name, duration: 2000 });
  };

  const hydratedInWishlist = hydrated && inWishlist;
  const hydratedInCompare = hydrated && inCompare;
  const hydratedCompareFull = hydrated && compareFull;

  return (
    <div className="pt-3 mt-auto space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleCompare(product.id)}
          title={hydratedInCompare ? "Убрать из сравнения" : hydratedCompareFull ? "Список сравнения заполнен (макс. 4)" : "Добавить к сравнению"}
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors active:scale-90",
            hydratedInCompare
              ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
              : hydratedCompareFull
              ? "bg-neutral-100 text-neutral-300 border-transparent cursor-not-allowed"
              : "bg-neutral-50 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 border-transparent"
          )}
        >
          <Scale size={16} />
        </button>

        <button
          onClick={() => toggleWishlist(product.id)}
          title={hydratedInWishlist ? "Убрать из избранного" : "Добавить в избранное"}
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors active:scale-90",
            hydratedInWishlist
              ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20"
              : "bg-neutral-50 text-neutral-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border-transparent"
          )}
        >
          <Heart size={16} />
        </button>

        <button
          onClick={() => {
            addToCart({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image: product.images[0] || "/images/placeholder.webp",
              quantity: 1,
              inStock: product.inStock !== false,
            });
            trackEcommerceAddToCart(
              { id: product.id, name: product.name, price: product.price, quantity: 1 },
              "catalog_grid"
            );
            fetch("/api/cart-event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: product.id, source: "catalog_grid" }),
            }).catch(() => {});
            void notifyAddedToCart();
          }}
          className="flex-1 h-10 bg-orange-50 border border-orange-100 text-orange-600 rounded-2xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors active:scale-95"
        >
          <ShoppingCart size={18} strokeWidth={2.5} />
        </button>
      </div>

      <QuickOrderModal
        product={{ id: product.id, name: product.name }}
        buttonClassName="w-full h-10 rounded-2xl border border-primary/25 bg-primary/5 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-primary hover:bg-primary hover:text-white transition-colors"
      />
    </div>
  );
}
