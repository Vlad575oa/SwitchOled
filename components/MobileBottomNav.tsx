"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GitCompare, Heart, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/product/store/useWishlistStore";
import { useCompareStore } from "@/features/product/store/useCompareStore";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home, label: "Главная", href: "/" },
  { icon: GitCompare, label: "Сравнить", href: "/compare" },
  { icon: Heart, label: "Избранное", href: "/wishlist" },
  { icon: ShoppingCart, label: "Корзина", href: "/cart" },
];

export const MobileBottomNav = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.count());
  const compareCount = useCompareStore((s) => s.count());

  useEffect(() => setMounted(true), []);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-stretch h-14">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isCart = href === "/cart";
          const isWishlist = href === "/wishlist";
          const isCompare = href === "/compare";
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const badge = mounted
            ? isCart ? cartCount : isWishlist ? wishlistCount : isCompare ? compareCount : 0
            : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors",
                isActive ? "text-primary" : "text-neutral-400"
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-black min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center shadow-sm">
                    {badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-wide", isActive ? "text-primary" : "text-neutral-400")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
