import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Search, Package, FileSpreadsheet } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductDeleteButton } from "./ProductDeleteButton";
import { ProductDuplicateButton } from "./ProductDuplicateButton";
import { ProductHideButton } from "./ProductHideButton";
import { ProductStockToggleButton } from "./ProductStockToggleButton";
import { InlinePriceEditor } from "./InlinePriceEditor";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string; category?: string; sort?: string; visibility?: string; stock?: string };
}

export default async function ProductsPage({ searchParams }: Props) {
  const q = searchParams.q ?? "";
  const categorySlug = searchParams.category ?? "";
  const sort = searchParams.sort ?? "newest";
  const visibility = searchParams.visibility ?? "all";
  const stock = searchParams.stock ?? "all";
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  const canDeleteProducts = session?.r !== "MANAGER";
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  let selectedCategoryIds: number[] = [];
  if (categorySlug) {
    const root = categories.find((c) => c.slug === categorySlug);
    if (root) {
      const byParent = new Map<number, number[]>();
      for (const c of categories) {
        if (c.parentId == null) continue;
        const bucket = byParent.get(c.parentId) ?? [];
        bucket.push(c.id);
        byParent.set(c.parentId, bucket);
      }
      const stack = [root.id];
      while (stack.length) {
        const current = stack.pop()!;
        selectedCategoryIds.push(current);
        const children = byParent.get(current) ?? [];
        for (const childId of children) stack.push(childId);
      }

    }
  }

  const orderBy =
    sort === "price-asc"
      ? ({ price: "asc" } as const)
      : sort === "price-desc"
        ? ({ price: "desc" } as const)
        : ({ createdAt: "desc" } as const);

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categorySlug
        ? selectedCategoryIds.length
          ? { categoryId: { in: selectedCategoryIds } }
          : { category: { slug: categorySlug } }
        : {}),
      ...(visibility === "shown"
        ? { isVisible: { not: false } }
        : visibility === "hidden"
          ? { isVisible: false }
          : {}),
      ...(stock === "inStock"
        ? { inStock: true }
        : stock === "outOfStock"
          ? { inStock: false }
          : {}),
    },
    include: { category: true },
    orderBy,
  });

  const editorProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    images: p.images,
    category: { name: p.category.name },
    inStock: p.inStock,
    isVisible: p.isVisible !== false,
    slug: p.slug,
    sku: p.sku
  }));

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111111]">Товары</h1>
          <p className="text-xs text-neutral-400 font-bold mt-0.5">{products.length} позиций</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/products/export"
            className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-neutral-50 transition-all"
          >
            <FileSpreadsheet size={14} /> Выгрузить в Excel
          </a>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-primary text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={14} /> Добавить
          </Link>
        </div>
      </header>

      <div className="p-8 space-y-5 pb-32">

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto no-scrollbar">
          <Link
            href="/admin/products"
            className={cn(
              "px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-widest transition-all",
              !categorySlug
                ? "bg-[#111111] text-white shadow-lg shadow-black/10"
                : "bg-white border border-neutral-200 text-neutral-400 hover:text-[#111111] hover:border-neutral-300"
            )}
          >
            Все
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/admin/products?category=${cat.slug}${q ? `&q=${q}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}${visibility !== "all" ? `&visibility=${visibility}` : ""}${stock !== "all" ? `&stock=${stock}` : ""}`}
              className={cn(
                "px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-widest transition-all",
                categorySlug === cat.slug
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white border border-neutral-200 text-neutral-400 hover:text-primary hover:border-primary/30"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Filters */}
        <form method="get" className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Поиск по названию, артикулу или slug..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-[#111111] placeholder:text-neutral-300 outline-none focus:border-primary/30"
            />
          </div>
          <select
            name="sort"
            defaultValue={sort}
            className="px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-[#111111] outline-none focus:border-primary/30"
          >
            <option value="newest">Сначала новые</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
          </select>
          <select
            name="visibility"
            defaultValue={visibility}
            className="px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-[#111111] outline-none focus:border-primary/30"
          >
            <option value="all">Все товары</option>
            <option value="shown">Только показанные</option>
            <option value="hidden">Только скрытые</option>
          </select>
          <select
            name="stock"
            defaultValue={stock}
            className="px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-[#111111] outline-none focus:border-primary/30"
          >
            <option value="all">Любое наличие</option>
            <option value="inStock">В наличии</option>
            <option value="outOfStock">Под заказ</option>
          </select>
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          <button type="submit" className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-all">
            Найти
          </button>
        </form>

        {/* Inline Price Editor */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm py-20 text-center">
            <Package size={40} className="mx-auto mb-3 text-neutral-200" />
            <p className="text-neutral-400 font-bold text-sm">Товаров не найдено</p>
          </div>
        ) : (
          <InlinePriceEditor 
            products={editorProducts} 
            canDelete={canDeleteProducts}
          />
        )}
      </div>
    </>
  );
}
