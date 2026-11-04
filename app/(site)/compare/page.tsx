"use client";

import { useCompareStore } from "@/features/product/store/useCompareStore";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Scale, ShoppingCart, Heart, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/product/store/useWishlistStore";
import { toast } from "sonner";
import { trackEcommerceAddToCart } from "@/lib/analytics/metrikaEcommerce";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  priceOld?: number | null;
  images: string[];
  inStock: boolean;
  isNew?: boolean;
  isSale?: boolean;
  brand?: string | null;
  description?: string | null;
  attributes?: Record<string, string> | null;
  category?: { slug: string; name: string };
}

type FilterKey = "all" | "main" | "specs" | "description";

const FILTER_CHIPS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "main", label: "Основное" },
  { id: "specs", label: "Характеристики" },
  { id: "description", label: "Описание" },
];

// Width of the sticky label column on mobile (px)
const LABEL_W = 96;
// Width of each product column on mobile (px)
const COL_W = 160;

export default function ComparePage() {
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) => s.has);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }
    fetch(`/api/products/recent?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data: Product[]) => {
        const map = new Map(data.map((p) => [p.id, p]));
        setProducts(ids.map((id) => map.get(id)).filter(Boolean) as Product[]);
      })
      .finally(() => setLoading(false));
  }, [ids.join(",")]);

  // Dynamically collect all attribute keys
  const dynamicAttrKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.attributes || {})))
  );

  const allAttrs = [
    { key: "price", label: "Цена", group: "main" },
    { key: "brand", label: "Бренд", group: "main" },
    { key: "inStock", label: "Наличие", group: "main" },
    { key: "description", label: "Описание", group: "description" },
    ...dynamicAttrKeys.map((key) => ({ key: `attr_${key}`, label: key, group: "specs" })),
  ];

  const visibleAttrs = allAttrs.filter((a) => {
    if (filter === "all") return true;
    return a.group === filter;
  });

  // Hide "specs" and "description" chips if no data
  const hasSpecs = dynamicAttrKeys.length > 0;
  const hasDescription = products.some((p) => p.description);
  const chips = FILTER_CHIPS.filter((c) => {
    if (c.id === "specs") return hasSpecs;
    if (c.id === "description") return hasDescription;
    return true;
  });

  const getValue = (product: Product, key: string): string => {
    if (key === "price") return formatPrice(product.price);
    if (key === "brand") return product.brand ?? "—";
    if (key === "inStock") return product.inStock ? "В наличии" : "Под заказ";
    if (key === "description") return product.description ?? "—";
    if (key.startsWith("attr_")) {
      const attrKey = key.replace("attr_", "");
      return (product.attributes as any)?.[attrKey] ?? "—";
    }
    return "—";
  };

  const renderValue = (p: Product, key: string, size: "sm" | "xs" = "sm") => {
    const val = getValue(p, key);
    const isInStock = key === "inStock";
    if (isInStock) {
      return (
        <span className={`flex items-center gap-1 font-black ${size === "xs" ? "text-[10px]" : "text-xs"} ${p.inStock ? "text-green-600" : "text-orange-500"}`}>
          {p.inStock ? <CheckCircle2 size={size === "xs" ? 11 : 13} /> : <XCircle size={size === "xs" ? 11 : 13} />}
          {val}
        </span>
      );
    }
    if (key === "description") {
      const plainText = typeof val === "string" ? val.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : val;
      return (
        <div
          className={`font-medium text-neutral-600 leading-relaxed line-clamp-5 ${size === "xs" ? "text-[10px]" : "text-xs"}`}
        >
          {plainText}
        </div>
      );
    }
    return (
      <span className={`font-bold text-secondary line-clamp-3 ${size === "xs" ? "text-[10px]" : "text-xs"}`}>{val}</span>
    );
  };

  // Total width of the inner grid (mobile)
  const mobileInnerWidth = LABEL_W + products.length * COL_W;

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-1.5 rounded-xl hover:bg-neutral-100 transition-colors">
                <ArrowLeft size={16} className="text-neutral-500" />
              </Link>
              <div>
                <h1 className="text-base font-black text-secondary flex items-center gap-1.5">
                  <Scale size={15} className="text-blue-500" />
                  Сравнение
                </h1>
                <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                  {products.length} {products.length === 1 ? "товар" : products.length < 5 ? "товара" : "товаров"} · макс. 4
                </p>
              </div>
            </div>
            {products.length > 0 && (
              <button
                onClick={clear}
                className="px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"
              >
                <X size={12} /> Очистить
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 py-8">
        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
              <Scale size={40} className="text-blue-300" />
            </div>
            <h2 className="text-2xl font-black text-secondary mb-2">Список сравнения пуст</h2>
            <p className="text-neutral-400 font-medium mb-8 max-w-sm">
              Добавляйте товары нажав <Scale size={14} className="inline" /> на карточке товара — до 4 позиций
            </p>
            <Link
              href="/"
              className="px-8 py-3 bg-primary text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-primary/20"
            >
              Перейти в каталог
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-28">
            <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* ── Compare Content ── */}
        {!loading && products.length > 0 && (
          <>
            {/* Filter chips — shown on both mobile & desktop */}
            {chips.length > 1 && (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setFilter(chip.id)}
                    className={`flex-none px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                      filter === chip.id
                        ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                        : "bg-white text-neutral-500 border border-neutral-200 hover:border-blue-300 hover:text-blue-500"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* ══════════════════════════════════════════
                MOBILE layout — single sync-scroll grid
                ══════════════════════════════════════════ */}
            <div className="block md:hidden -mx-4">
              {/* One scroll container for EVERYTHING — cards + rows */}
              <div
                className="overflow-x-auto"
                style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as any }}
              >
                <div style={{ width: mobileInnerWidth, minWidth: mobileInnerWidth }}>

                  {/* ── Product cards row ── */}
                  <div className="flex">
                    {/* Sticky corner placeholder */}
                    <div
                      className="flex-none sticky left-0 z-20 bg-[#f8f9fa]"
                      style={{ width: LABEL_W }}
                    />
                    {/* Cards */}
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="flex-none px-1.5 pb-3"
                        style={{ width: COL_W }}
                      >
                        <div className="bg-white rounded-3xl border border-neutral-100 p-3 relative shadow-sm flex flex-col h-full">
                          {/* Remove */}
                          <button
                            onClick={() => remove(p.id)}
                            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-neutral-100 hover:bg-red-500 hover:text-white flex items-center justify-center text-neutral-500 transition-all"
                            title="Убрать из сравнения"
                          >
                            <X size={11} />
                          </button>

                          {/* Image */}
                          <Link href={`/catalog/${p.category?.slug}/${p.slug}`}>
                            <div className="relative h-24 mb-2">
                              <Image src={p.images[0] || "/images/placeholder.webp"} alt={p.name} fill className="object-contain" />
                            </div>
                          </Link>

                          {/* Name */}
                          <Link href={`/catalog/${p.category?.slug}/${p.slug}`}>
                            <h3 className="text-[9px] font-black text-secondary leading-[1.3] line-clamp-2 hover:text-primary transition-colors mb-1.5 text-left">
                              {p.name}
                            </h3>
                          </Link>

                          {/* Price */}
                          <p className="text-sm font-black text-secondary mb-2 text-left">{formatPrice(p.price)}</p>

                          {/* Actions */}
                          <div className="flex gap-1 mt-auto">
                            <button
                              onClick={() => {
                                addToCart({ id: p.id, name: p.name, slug: p.slug, price: p.price, image: p.images[0] || "/images/placeholder.webp", quantity: 1 });
                                trackEcommerceAddToCart({ id: p.id, name: p.name, price: p.price }, "catalog_grid");
                                toast.success("Добавлено в корзину", { description: p.name, duration: 2000 });
                              }}
                              className="flex-1 h-7 bg-orange-500 text-white rounded-xl text-[8px] font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-0.5"
                            >
                              <ShoppingCart size={10} />
                              В корзину
                            </button>
                            <button
                              onClick={() => toggleWishlist(p.id)}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all flex-none ${
                                inWishlist(p.id) ? "bg-red-500 text-white" : "bg-neutral-100 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                              }`}
                            >
                              <Heart size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Attribute rows ── */}
                  {visibleAttrs.map((attr, idx) => (
                    <div
                      key={attr.key}
                      className={`flex items-start ${idx % 2 === 0 ? "bg-white" : "bg-neutral-50/80"}`}
                    >
                      {/* Sticky label */}
                      <div
                        className={`flex-none sticky left-0 z-10 py-3 pl-4 pr-2 flex items-start ${idx % 2 === 0 ? "bg-white" : "bg-neutral-50/80"}`}
                        style={{ width: LABEL_W, minWidth: LABEL_W }}
                      >
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider leading-tight">
                          {attr.label}
                        </span>
                      </div>

                      {/* Product values */}
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className="flex-none py-3 px-2"
                          style={{ width: COL_W, minWidth: COL_W }}
                        >
                          {renderValue(p, attr.key, "xs")}
                        </div>
                      ))}
                    </div>
                  ))}

                </div>
              </div>

              {/* Scroll indicator dots (only if > 2 products) */}
              {products.length > 2 && (
                <div className="flex justify-center gap-1.5 pt-3 pb-1">
                  {products.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  ))}
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════
                DESKTOP layout — table (unchanged)
                ══════════════════════════════════════════ */}
            <div className="hidden md:block overflow-x-auto rounded-3xl pb-4">
              <table className="w-full border-collapse" style={{ minWidth: Math.max(products.length * 220 + 180, 0) + "px" }}>
                <thead>
                  <tr>
                    <th className="w-[180px] text-left pr-4 align-top py-4">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Характеристика</span>
                    </th>
                    {products.map((p) => (
                      <th key={p.id} className="align-top px-3 py-4 min-w-[220px]">
                        <div className="bg-white rounded-3xl border border-neutral-100 p-4 relative shadow-sm hover:shadow-md transition-shadow">
                          <button
                            onClick={() => remove(p.id)}
                            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-neutral-100 hover:bg-red-500 hover:text-white flex items-center justify-center text-neutral-500 transition-all shadow-sm"
                            title="Убрать из сравнения"
                          >
                            <X size={14} />
                          </button>
                          <Link href={`/catalog/${p.category?.slug}/${p.slug}`}>
                            <div className="relative h-36 mb-3">
                              <Image src={p.images[0] || "/images/placeholder.webp"} alt={p.name} fill className="object-contain" />
                            </div>
                          </Link>
                          <Link href={`/catalog/${p.category?.slug}/${p.slug}`}>
                            <h3 className="text-[11px] font-black text-secondary leading-[1.3] line-clamp-2 hover:text-primary transition-colors mb-3 text-left">
                              {p.name}
                            </h3>
                          </Link>
                          <p className="text-xl font-black text-secondary mb-3 text-left">{formatPrice(p.price)}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                addToCart({ id: p.id, name: p.name, slug: p.slug, price: p.price, image: p.images[0] || "/images/placeholder.webp", quantity: 1 });
                                trackEcommerceAddToCart({ id: p.id, name: p.name, price: p.price }, "catalog_grid");
                                toast.success("Добавлено в корзину", { description: p.name, duration: 2000 });
                              }}
                              className="flex-1 h-9 bg-orange-500 text-white rounded-xl text-[10px] font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-1.5"
                            >
                              <ShoppingCart size={14} />
                              В корзину
                            </button>
                            <button
                              onClick={() => toggleWishlist(p.id)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                inWishlist(p.id) ? "bg-red-500 text-white" : "bg-neutral-100 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                              }`}
                            >
                              <Heart size={14} />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visibleAttrs.map((attr, idx) => (
                    <tr key={attr.key} className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50/60"}>
                      <td className="py-4 pr-4 pl-4 rounded-l-2xl align-top">
                        <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                          {attr.label}
                        </span>
                      </td>
                      {products.map((p) => (
                        <td key={p.id} className="px-5 py-4 rounded-2xl align-top">
                          {renderValue(p, attr.key, "sm")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
