"use client";

import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/product/store/useWishlistStore";
import { useCompareStore } from "@/features/product/store/useCompareStore";
import { ShoppingCart, Search as SearchIcon, Heart, Phone, Plus, X, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
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

const NAV_LINKS = [
  { label: "О нас", href: "/about" },
  { label: "Блог", href: "/blog" },
  { label: "Доставка", href: "/delivery" },
  { label: "Сервис", href: "/service" },
];

const MENU_LINKS = [
  { label: "Весь каталог", href: "/catalog/all" },
  { label: "Nintendo Switch OLED", href: "/catalog/nintendo-switch-oled" },
  { label: "Nintendo Switch Lite", href: "/catalog/nintendo-switch-lite" },
  { label: "Игры", href: "/catalog/games" },
  { label: "О нас", href: "/about" },
  { label: "Блог", href: "/blog" },
  { label: "Доставка и оплата", href: "/delivery" },
  { label: "Гарантия", href: "/warranty" },
  { label: "Сервисный центр", href: "/service" },
  { label: "Сравнение", href: "/compare" },
  { label: "Контакты", href: "/contacts" },
];

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Gameshop24 — на главную">
    <span className="w-[18px] h-[18px] rounded-full border-[4.5px] border-black" />
    <span className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.01em] text-black">Gameshop24</span>
  </Link>
);

// Minimal navigation whose left/right groups are "notch" tabs: on the home page
// the hero slides underneath, so the tabs read as cut-outs in the hero corners.
export const Header = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((state) => state.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);
  const wishlistCount = useWishlistStore((s) => s.count());
  const wishlistSynced = useWishlistStore((s) => s.synced);
  const syncWishlist = useWishlistStore((s) => s.syncWithAccount);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const clearCompare = useCompareStore((s) => s.clear);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me").then((r) => r.json()).then(setUser).catch(() => {});
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

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    clearCart();
    clearWishlist();
    clearCompare();
    router.refresh();
  };

  const navLink = "text-[15px] font-medium text-black hover:text-black/60 transition-colors whitespace-nowrap";
  const cartLabel = `(${mounted ? totalItems : 0})`;

  return (
    <header className="relative z-40 px-3 pt-2">
      <div className="relative flex items-start justify-between h-12">
        {/* Left tab */}
        <div className="notch-tl flex items-center gap-6 lg:gap-7 h-12 pr-5 lg:pr-8 pl-2 sm:pl-4">
          <Logo />
          <nav className="hidden lg:flex items-center gap-6">
            <button
              type="button"
              onClick={() => setMegaMenuOpen((v) => !v)}
              className={cn(navLink, "inline-flex items-center gap-1")}
              aria-expanded={megaMenuOpen}
            >
              Каталог <Plus size={15} className={cn("transition-transform", megaMenuOpen && "rotate-45")} />
            </button>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={navLink}>{l.label}</Link>
            ))}
          </nav>
        </div>

        {/* Right tab */}
        <div className="notch-tr flex items-center gap-4 sm:gap-5 h-12 pl-5 lg:pl-8 pr-2 sm:pr-4">
          <button type="button" onClick={() => setSearchOpen((v) => !v)} aria-label="Поиск" className="text-black hover:text-black/60 transition-colors">
            {searchOpen ? <X size={18} /> : <SearchIcon size={18} />}
          </button>
          <a href={`tel:${CONTACTS.phoneHref}`} className="hidden xl:inline text-[15px] font-medium text-black hover:text-black/60 transition-colors">
            {CONTACTS.phoneDisplay}
          </a>
          <a href={`tel:${CONTACTS.phoneHref}`} aria-label="Позвонить" className="xl:hidden text-black">
            <Phone size={17} />
          </a>
          <Link href="/wishlist" className="hidden sm:inline-flex items-center gap-1 text-[15px] font-medium text-black hover:text-black/60 transition-colors" aria-label="Избранное">
            <Heart size={18} />({mounted ? wishlistCount : 0})
          </Link>
          <Link href="/cart" className="inline-flex items-center gap-1 text-[15px] font-medium text-black hover:text-black/60 transition-colors" aria-label="Корзина">
            <ShoppingCart size={18} />{cartLabel}
          </Link>
          {mounted && user && (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button type="button" onClick={() => setUserMenuOpen((v) => !v)} aria-label="Профиль" className="text-black hover:text-black/60 transition-colors">
                <User size={18} />
              </button>
              {userMenuOpen && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-56 rounded-xl bg-white border border-neutral-200 shadow-xl p-1.5 z-[60]">
                  <p className="px-3 py-2 text-sm font-semibold text-black truncate">{user.name ?? user.email}</p>
                  <Link href="/account/orders" className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-neutral-100 rounded-lg">Мои заказы</Link>
                  <Link href="/wishlist" className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-neutral-100 rounded-lg">Избранное</Link>
                  <button type="button" onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-neutral-100 rounded-lg">Выйти</button>
                </div>
              )}
            </div>
          )}
          <button type="button" onClick={() => setMenuOpen(true)} className="lg:hidden text-[15px] font-medium text-black">
            Меню
          </button>
        </div>

        {megaMenuOpen && (
          <div className="absolute left-0 right-0 top-full">
            <CatalogMegaMenu onClose={() => setMegaMenuOpen(false)} />
          </div>
        )}

        {searchOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 flex justify-center">
            <div className="w-full max-w-[760px] rounded-2xl bg-white p-3 shadow-2xl border border-neutral-200">
              <Search />
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[200] bg-white flex flex-col lg:hidden">
          <div className="flex items-center justify-between h-16 px-5">
            <Logo />
            <button type="button" onClick={() => setMenuOpen(false)} className="text-[15px] font-medium text-black">
              Закрыть
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 pb-6">
            {MENU_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between py-3.5 border-b border-neutral-100 text-[19px] font-medium text-black">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] space-y-3">
            <a href={`tel:${CONTACTS.phoneHref}`} className="flex items-center justify-center h-12 rounded-xl bg-black text-white text-[16px] font-semibold">
              {CONTACTS.phoneDisplay}
            </a>
            <p className="text-center text-[13px] text-black/50">{CONTACTS.address}</p>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
