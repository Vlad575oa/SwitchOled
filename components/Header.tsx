"use client";

import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/product/store/useWishlistStore";
import { useCompareStore } from "@/features/product/store/useCompareStore";
import { ShoppingCart, Menu, User, LogOut, Package, Heart, Scale, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { CONTACTS } from "@/lib/constants/contacts";

const Search = dynamic(
  () => import("@/features/search/components/Search").then((m) => m.Search),
  { ssr: false }
);

const CatalogMegaMenu = dynamic(
  () => import("./CatalogMegaMenu").then((m) => m.CatalogMegaMenu),
  { ssr: false }
);

interface CurrentUser {
  id: number;
  name?: string | null;
  email?: string | null;
}

export const Header = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchReady, setSearchReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((state) => state.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);
  const wishlistCount = useWishlistStore((s) => s.count());
  const wishlistSynced = useWishlistStore((s) => s.synced);
  const syncWishlist = useWishlistStore((s) => s.syncWithAccount);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const compareCount = useCompareStore((s) => s.count());
  const clearCompare = useCompareStore((s) => s.clear);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me").then((r) => r.json()).then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearchReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id || wishlistSynced) return;
    void syncWishlist();
  }, [mounted, user?.id, wishlistSynced, syncWishlist]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    clearCart();
    clearWishlist();
    clearCompare();
    router.refresh();
  };

  const iconBtn = "flex flex-col items-center justify-center w-[68px] xl:w-[76px] h-[52px] xl:h-[58px] rounded-lg hover:bg-white/[0.08] transition-all group relative";
  const iconLabel = "text-[10px] xl:text-[11px] font-semibold text-white uppercase tracking-wide mt-1 transition-colors text-center";

  return (
    <header className="relative z-50 h-[76px] xl:h-[88px] flex items-center bg-black lg:sticky lg:top-[80px]">
      <div className="relative w-full max-w-[1920px] mx-auto px-4 lg:pl-6 lg:pr-4 2xl:pl-4 2xl:pr-4 flex items-center gap-2 xl:gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="hidden lg:flex w-9 h-9 xl:w-11 xl:h-11 bg-primary rounded-full items-center justify-center transition-colors group-hover:bg-primary-pressed overflow-hidden relative">
            <span className="text-white font-bold text-lg xl:text-xl leading-none z-10 select-none">G</span>
          </div>
          <div className="hidden lg:flex flex-col leading-none">
            <span className="text-[9px] xl:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Premium Store</span>
            <span className="font-display text-[19px] xl:text-[22px] font-light text-white tracking-[0.02em] leading-tight">
              Gameshop<span className="text-[#53b1ff]">24</span>
            </span>
          </div>
        </Link>

        {/* Catalog */}
        <button
          onClick={() => setMegaMenuOpen((v) => !v)}
          className={cn(
            "hidden lg:flex items-center gap-2 px-5 xl:px-6 h-10 xl:h-12 border rounded-full font-bold text-[13px] xl:text-[14px] uppercase tracking-[0.03em] transition-all group shrink-0",
            megaMenuOpen
              ? "bg-white/15 border-white/20 text-white"
              : "bg-white/[0.06] border-white/[0.08] text-white/70 hover:bg-white/10 hover:text-white hover:border-white/15"
          )}
        >
          <Menu size={14} className={cn("transition-transform duration-200", megaMenuOpen && "rotate-90")} />
          <span>Каталог</span>
        </button>
        {megaMenuOpen && <CatalogMegaMenu onClose={() => setMegaMenuOpen(false)} />}



        <a
          href={CONTACTS.yandexMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-2 rounded-2xl text-white border border-white/12 bg-white/[0.06] hover:bg-white/[0.1] transition-colors shrink-0"
          title={CONTACTS.address}
        >
          <MapPin size={13} className="text-white/80 shrink-0" />
          <span className="flex flex-col leading-[1.02]">
            <span className="text-[9px] font-bold uppercase tracking-tight">Москва</span>
            <span className="text-[9px] font-bold uppercase tracking-tight">Шоурум</span>
          </span>
        </a>

        {/* Search */}
        <div
          className="flex-1 min-w-0 sm:min-w-[150px] lg:flex-none lg:w-full lg:max-w-[760px] lg:absolute lg:left-1/2 lg:-translate-x-1/2"
          onMouseEnter={() => setSearchReady(true)}
          onFocusCapture={() => setSearchReady(true)}
          onTouchStart={() => setSearchReady(true)}
        >
          {searchReady ? (
            <Search />
          ) : (
            <button
              type="button"
              aria-label="Открыть поиск"
              onClick={() => setSearchReady(true)}
              className="w-full h-11 rounded-[14px] bg-white border-2 border-neutral-200 text-left px-4 text-[16px] lg:text-[14px] text-neutral-400 font-medium"
            >
              Искать в Gameshop24...
            </button>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-5 lg:gap-6 shrink-0 ml-auto">

          {/* Auth */}
          <div className="relative" ref={menuRef}>
            {mounted && user ? (
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className={iconBtn}>
                <div className="relative">
                  <User size={18} className="text-white transition-colors" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full ring-2 ring-black" />
                </div>
                <span className={iconLabel}>{user.name?.split(" ")[0] ?? "Профиль"}</span>
                {userMenuOpen && (
                  <div className="absolute top-[calc(100%+6px)] right-0 w-56 rounded-2xl shadow-2xl p-1.5 z-[60] animate-in fade-in slide-in-from-top-2 bg-[#121314] border border-white/[0.08]">
                    <div className="px-4 py-3 mb-1 rounded-xl bg-white/[0.04]">
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Личный кабинет</p>
                      <p className="text-sm font-black text-white mt-1 truncate">{user.name ?? user.email}</p>
                    </div>
                    <ul className="space-y-0.5">
                      <li>
                        <Link href="/account/orders" className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                          <Package size={14} className="text-white/25" /> Мои заказы
                        </Link>
                      </li>
                      <li>
                        <Link href="/wishlist" className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                          <Heart size={14} className="text-white/25" /> Избранное
                        </Link>
                      </li>
                      <li className="pt-1 border-t border-white/[0.06]">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-all">
                          <LogOut size={14} /> Выход
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </button>
            ) : (
              null
            )}
          </div>

          {/* Wishlist */}
          <Link href="/wishlist" className={cn(iconBtn, "hidden sm:flex", pathname === "/wishlist" && "bg-primary/10 border border-primary/20")}>
            <div className="relative">
              <Heart size={18} className={cn("transition-colors", mounted && wishlistCount > 0 ? "text-red-400 fill-red-400" : "text-white")} />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-black min-w-[14px] h-[14px] px-1 rounded-full ring-2 ring-black flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className={iconLabel}>Избранное</span>
          </Link>

          {/* Compare */}
          <Link href="/compare" className={cn(iconBtn, "hidden sm:flex", pathname === "/compare" && "bg-primary/10 border border-primary/20")}>
            <div className="relative">
              <Scale size={18} className={cn("transition-colors", mounted && compareCount > 0 ? "text-blue-400" : "text-white")} />
              {mounted && compareCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[8px] font-black min-w-[14px] h-[14px] px-1 rounded-full ring-2 ring-black flex items-center justify-center">
                  {compareCount}
                </span>
              )}
            </div>
            <span className={iconLabel}>Сравнить</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className={cn(iconBtn, pathname === "/cart" && "bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/35")}>
            <div className="relative">
              <ShoppingCart size={18} className={cn("transition-colors", mounted && totalItems > 0 ? "text-primary" : "text-white")} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-black min-w-[14px] h-[14px] px-1 rounded-full ring-2 ring-black shadow-lg shadow-primary/30 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className={cn(iconLabel, "group-hover:text-primary")}>Корзина</span>
          </Link>

        </div>
      </div>
    </header>
  );
};
