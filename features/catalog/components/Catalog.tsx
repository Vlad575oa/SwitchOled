import {
  getProducts,
  getProductsNintendoFirst,
  getProductsCount,
  getCategoryBySlug,
  getCategoryTree,
  getCategoryDescendantSlugsBySlug,
  getCatalogVariantFilters,
} from "@/lib/queries";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { ProductCard } from "@/features/product/components/ProductCard";
import { MobileFilterDrawer } from "@/features/catalog/components/MobileFilterDrawer";

// FilterSidebar uses framer-motion — lazy load so it doesn't block initial render
const FilterSidebar = dynamic(
  () => import("@/features/catalog/components/FilterSidebar").then((m) => m.FilterSidebar),
  { ssr: false }
);
import { SortingSelect } from "@/features/catalog/components/SortingSelect";
import { ActiveFiltersBar } from "@/features/catalog/components/ActiveFiltersBar";
import { CATEGORY_FILTERS } from "@/features/catalog/config/categoryFilters";
import { Pagination } from "./Pagination";
import { Prisma } from "@prisma/client";
import { buildProductSearchWhere } from "@/lib/search";

interface CatalogProps {
  category: string;
  searchParams: Record<string, string | undefined>;
  pageSize?: number;
  gridClassName?: string;
}

export async function Catalog({
  category,
  searchParams,
  pageSize = 12,
  gridClassName = "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-[3px] sm:gap-4",
}: CatalogProps) {
  const { q, priceMin, priceMax, color, memory, status, sort, page = "1" } = searchParams;
  const skip = (parseInt(page) - 1) * pageSize;
  let categorySlugs =
    category !== "all" ? await getCategoryDescendantSlugsBySlug(category) : [];

  // ── Build Prisma filters ───────────────────────────────────────────────────
  const andConditions: Prisma.ProductWhereInput[] = [];

  if (category !== "all") {
    andConditions.push({
      category: {
        slug: categorySlugs.length ? { in: categorySlugs } : category,
      },
    });
  }

  if (q) {
    const searchWhere = buildProductSearchWhere(q.trim());
    if (searchWhere) {
      andConditions.push(searchWhere);
    }
  }

  if (priceMin || priceMax) {
    andConditions.push({
      price: {
        ...(priceMin ? { gte: parseInt(priceMin) * 100 } : {}),
        ...(priceMax ? { lte: parseInt(priceMax) * 100 } : {}),
      },
    });
  }

  if (color) {
    const colorValues = color.split(",").filter(Boolean);
    andConditions.push({
      color: colorValues.length === 1 ? colorValues[0] : { in: colorValues },
    });
  }

  if (memory) {
    const memoryValues = memory.split(",").filter(Boolean);
    if (memoryValues.length) {
      andConditions.push({
        OR: memoryValues.flatMap((value) => [
          { attributes: { path: ["Накопитель"], string_contains: value } },
          { attributes: { path: ["Объём"], string_contains: value } },
          { attributes: { path: ["Объем"], string_contains: value } },
        ]),
      });
    }
  }

  if (status) {
    const statusValues = status.split(",").filter(Boolean);
    const wantsInStock = statusValues.includes("inStock");
    const wantsOnOrder = statusValues.includes("onOrder");
    if (wantsInStock && !wantsOnOrder) andConditions.push({ inStock: true });
    if (wantsOnOrder && !wantsInStock) andConditions.push({ inStock: false });
  }

  // ── Category-specific attribute filters ───────────────────────────────────
  const categoryFilterSections = CATEGORY_FILTERS[category] ?? [];
  const hasAttributeFilters = categoryFilterSections.some(
    (section) => Boolean(searchParams[section.paramKey])
  );
  for (const section of categoryFilterSections) {
    const raw = searchParams[section.paramKey];
    if (!raw) continue;
    const values = raw.split(",").filter(Boolean);
    if (!values.length) continue;

    const attrKey = section.paramKey.replace("attr_", "");
    andConditions.push({
      OR: values.map((v) => ({
        attributes: {
          path: [attrKey],
          string_contains: v,
        },
      })),
    });
  }

  const where: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // ── Sorting ────────────────────────────────────────────────────────────────
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  if (sort === "price-desc") orderBy = { price: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  // ── Data Fetching ─────────────────────────────────────────────────────────
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let totalCount = 0;
  let categoryData: { name: string } | null = { name: "Весь каталог" };
  let categoryTree: Awaited<ReturnType<typeof getCategoryTree>> = [];
  let availableVariantFilters: { colors: Array<{ name: string; hex: string }>; memories: string[] } = { colors: [], memories: [] };
  let dbError = false;

  let errorMsg = "";
  try {
    // On the "all" tab with default sort, prioritize Nintendo products
    const hasNonSearchFilters = Boolean(
      priceMin || priceMax || color || memory || status || hasAttributeFilters
    );
    const useNintendoPriority = category === "all" && !sort && !q && !hasNonSearchFilters;
    products = useNintendoPriority
      ? await getProductsNintendoFirst(where, skip, pageSize)
      : await getProducts(where, orderBy, skip, pageSize);
    totalCount = await getProductsCount(where);
    categoryData =
      category !== "all"
        ? await getCategoryBySlug(category)
        : { name: "Весь каталог" };
    categoryTree = await getCategoryTree();
    availableVariantFilters = await getCatalogVariantFilters(
      categorySlugs.length ? categorySlugs : category !== "all" ? [category] : []
    );
  } catch (err: any) {
    dbError = true;
    errorMsg = err.message || "Unknown error";
    console.error("CATALOG FETCH ERROR:", err);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  const hasFilters = Object.keys(searchParams).some(
    (k) => k !== "sort" && k !== "page" && searchParams[k]
  );

  const activeFilterCount = Object.keys(searchParams).filter(
    (k) => k !== "sort" && k !== "page" && k !== "q" && searchParams[k]
  ).length;

  if (dbError) {
    return (
      <div className="py-32 text-center">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="text-xl font-black text-secondary mb-2">Каталог временно недоступен</p>
        <p className="text-sm text-neutral-400 font-medium">Мы уже работаем над устранением проблемы. Попробуйте позже.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 xl:gap-10">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:block w-[300px] xl:w-[320px] flex-shrink-0">
        <Suspense fallback={null}>
          <FilterSidebar
            currentCategory={category}
            totalCount={totalCount}
            categoryTree={categoryTree}
            availableColors={availableVariantFilters.colors}
            availableMemories={availableVariantFilters.memories}
          />
        </Suspense>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-secondary leading-tight">
              {categoryData?.name ?? "Каталог"}
            </h1>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">
              {totalCount} товаров найдено
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Более 100 довольных клиентов каждый месяц
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="lg:hidden">
              <Suspense fallback={null}>
                <MobileFilterDrawer
                  currentCategory={category}
                  totalCount={totalCount}
                  categoryTree={categoryTree}
                  activeFilterCount={activeFilterCount}
                  availableColors={availableVariantFilters.colors}
                  availableMemories={availableVariantFilters.memories}
                />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <SortingSelect />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={null}>
          <ActiveFiltersBar />
        </Suspense>

        {products.length > 0 ? (
          <>
            <div className="-mx-6 sm:mx-0">
              <div className={gridClassName}>
                {products.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    eagerImage={idx < 2}
                  />
                ))}
              </div>
            </div>
            <Suspense fallback={null}>
              <Pagination totalPages={totalPages} />
            </Suspense>
          </>
        ) : (
          <div className="bg-neutral-50 rounded-[32px] py-32 text-center">
            <p className="text-xl text-neutral-400 font-bold">Ничего не найдено</p>
            <p className="text-neutral-500 mt-2 text-sm">
              {hasFilters
                ? "Попробуйте изменить параметры фильтрации"
                : "В этой категории пока нет товаров"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
