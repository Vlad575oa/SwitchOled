import { Truck, ShieldCheck, Gamepad2, Store } from "lucide-react";
import { getAllProducts } from "@/lib/queries";
import { FavoritesRail, type FavoriteItem } from "./FavoritesRail";

const FEATURES = [
  { icon: Truck, label: "Доставка в день заказа" },
  { icon: Store, label: "Шоурум в Москве" },
  { icon: Gamepad2, label: "100+ игр в комплекте" },
  { icon: ShieldCheck, label: "Гарантия 1 год" },
];

export function FeatureBar() {
  return (
    <div className="hidden md:block px-3 pt-3">
      <div className="h-[72px] lg:h-20 rounded-2xl bg-black text-white flex items-center justify-center gap-10 lg:gap-20 px-6">
        {FEATURES.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-2.5 text-[15px] lg:text-[17px] font-medium whitespace-nowrap">
            <Icon size={20} strokeWidth={1.6} />
            {label}
          </span>
        ))}
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
  const products = await getAllProducts(10);
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
