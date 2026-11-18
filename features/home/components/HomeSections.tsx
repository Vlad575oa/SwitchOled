import { Truck, ShieldCheck, Gamepad2, Store } from "lucide-react";
import { getAllProducts, getProductsByIds } from "@/lib/queries";
import { getPageContent } from "@/lib/getPageContent";
import { FavoritesRail, type FavoriteItem } from "./FavoritesRail";

const FEATURES = [
  { icon: Truck, label: "Доставка в день заказа" },
  { icon: Store, label: "Шоурум в Москве" },
  { icon: Gamepad2, label: "100+ игр в комплекте" },
  { icon: ShieldCheck, label: "Гарантия 1 год" },
];

export function FeatureBar() {
  const item = ({ icon: Icon, label }: (typeof FEATURES)[number], key: string) => (
    <span key={key} className="inline-flex items-center gap-2.5 text-[14px] md:text-[15px] lg:text-[17px] font-medium whitespace-nowrap shrink-0">
      <Icon size={20} strokeWidth={1.6} />
      {label}
    </span>
  );

  return (
    <div className="px-3 pt-3">
      <div className="h-14 md:h-[72px] lg:h-20 rounded-2xl bg-black text-white flex items-center overflow-hidden">
        {/* Phones: endless marquee running left */}
        <div className="md:hidden flex animate-marquee will-change-transform">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-8 pr-8" aria-hidden={copy === 1}>
              {FEATURES.map((f) => item(f, `${copy}-${f.label}`))}
            </div>
          ))}
        </div>
        {/* Tablets and up: static, centered */}
        <div className="hidden md:flex w-full items-center justify-center gap-10 lg:gap-20 px-6">
          {FEATURES.map((f) => item(f, f.label))}
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-16 lg:h-[72px] rounded-2xl bg-surface-soft flex items-center justify-center">
      <h2 className="text-[17px] lg:text-[19px] font-medium text-black">{children}</h2>
    </div>
  );
}

export async function Favorites() {
  // Products picked in admin (Страницы → Главная → «Популярное»), otherwise the newest ones
  const home = (await getPageContent("home")) as Record<string, unknown>;
  const pickedIds = Array.isArray(home.popular_product_ids)
    ? (home.popular_product_ids as unknown[]).map(Number).filter(Number.isFinite)
    : [];
  const picked = pickedIds.length ? await getProductsByIds(pickedIds) : [];
  const products = picked.length ? picked : await getAllProducts(10);
  if (!products.length) return null;

  const items: FavoriteItem[] = products.map((p) => ({
    id: p.id,
    name: p.name.replace(/^Nintendo Switch\s+/i, ""),
    fullName: p.name,
    href: `/catalog/${p.category?.slug || "any"}/${p.slug}`,
    image: p.images[0] || "/images/placeholder.webp",
    price: p.price,
    badge: p.priceOld && p.priceOld > p.price
      ? `−${Math.round((1 - p.price / p.priceOld) * 100)}%`
      : p.isNew ? "Новинка" : null,
  }));

  return (
    <section className="px-3 pt-3">
      <SectionTitle>Популярное</SectionTitle>
      <FavoritesRail items={items} />
    </section>
  );
}
