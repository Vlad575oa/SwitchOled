import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCategorySlugsVisibleInCatalog } from "@/lib/categoryVisibility";

const VISIBLE: Prisma.ProductWhereInput = { isVisible: { not: false } };

const safeQuery = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.error("DATABASE QUERY ERROR:", error);
    return fallback;
  }
};

export const getCategories = cache(async () => {
  return safeQuery(
    () => prisma.category.findMany({ orderBy: { name: "asc" } }),
    []
  );
});

export const getCategoryTree = cache(async () => {
  return safeQuery(async () => {
    const allCats = await prisma.category.findMany({
      include: {
        children: {
          include: {
            children: {
              include: { _count: { select: { products: { where: VISIBLE } } } },
            },
            _count: { select: { products: { where: VISIBLE } } },
          },
        },
        _count: { select: { products: { where: VISIBLE } } },
      },
      where: { parentId: null },
      orderBy: { name: "asc" },
    });

    // Keep only categories that have at least one visible product (direct or in descendants)
    return allCats
      .map((root) => ({
        ...root,
        children: root.children
          .map((child) => ({
            ...child,
            children: child.children.filter((gc) => gc._count.products > 0),
          }))
          .filter((child) =>
            child._count.products > 0 || child.children.some((gc) => gc._count.products > 0)
          ),
      }))
      .filter((root) =>
        root._count.products > 0 ||
        root.children.some(
          (child) => child._count.products > 0 || child.children.some((gc) => gc._count.products > 0)
        )
      );
  }, []);
});

export const getCategorySlugsWithProducts = unstable_cache(
  async (): Promise<string[]> => {
    return safeQuery(async () => {
      // Get all categories with their parentId and direct visible product count
      const all = await prisma.category.findMany({
        select: { id: true, slug: true, parentId: true, _count: { select: { products: { where: VISIBLE } } } },
      });

      return getCategorySlugsVisibleInCatalog(
        all.map((category) => ({
          id: category.id,
          slug: category.slug,
          parentId: category.parentId,
          productCount: category._count.products,
        }))
      );
    }, []);
  },
  ["category-slugs-with-products"],
  { revalidate: 300, tags: ["products"] }
);

export const getCategoryBySlug = cache(async (slug: string) => {
  return safeQuery(
    () => prisma.category.findUnique({ where: { slug } }),
    null
  );
});

export const getCategoryDescendantIdsBySlug = cache(async (slug: string) => {
  return safeQuery(async () => {
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true, parentId: true },
    });
    const root = categories.find((c) => c.slug === slug);
    if (!root) return [] as number[];

    const byParent = new Map<number, number[]>();
    for (const category of categories) {
      if (category.parentId == null) continue;
      const bucket = byParent.get(category.parentId) ?? [];
      bucket.push(category.id);
      byParent.set(category.parentId, bucket);
    }

    const result: number[] = [];
    const stack = [root.id];
    while (stack.length) {
      const currentId = stack.pop()!;
      result.push(currentId);
      const children = byParent.get(currentId) ?? [];
      for (const childId of children) stack.push(childId);
    }
    return result;
  }, [] as number[]);
});

export const getCategoryDescendantSlugsBySlug = cache(async (slug: string) => {
  return safeQuery(async () => {
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true, parentId: true },
    });
    const root = categories.find((c) => c.slug === slug);
    if (!root) return [] as string[];

    const byParent = new Map<number, number[]>();
    const byId = new Map<number, { id: number; slug: string }>();
    for (const category of categories) {
      byId.set(category.id, { id: category.id, slug: category.slug });
      if (category.parentId == null) continue;
      const bucket = byParent.get(category.parentId) ?? [];
      bucket.push(category.id);
      byParent.set(category.parentId, bucket);
    }

    const result: string[] = [];
    const stack = [root.id];
    while (stack.length) {
      const currentId = stack.pop()!;
      const current = byId.get(currentId);
      if (current) result.push(current.slug);
      const children = byParent.get(currentId) ?? [];
      for (const childId of children) stack.push(childId);
    }
    return result;
  }, [] as string[]);
});

export const getCategorySlugsByPrefix = cache(async (prefix: string) => {
  return safeQuery(
    async () => {
      const rows = await prisma.category.findMany({
        where: { slug: { startsWith: prefix } },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    },
    [] as string[]
  );
});

export const getProducts = async (
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  skip: number,
  take: number
) => {
  return safeQuery(
    () => prisma.product.findMany({
      where: { AND: [VISIBLE, where] },
      orderBy: [{ inStock: "desc" }, orderBy],
      skip,
      take,
      include: { category: true },
    }),
    []
  );
};

// Returns products with Nintendo/Switch categories first, then rest by newest
export const getProductsNintendoFirst = async (
  where: Prisma.ProductWhereInput,
  skip: number,
  take: number
) => {
  return safeQuery(async () => {
    const rows = await prisma.product.findMany({
      where: { AND: [VISIBLE, where] },
      orderBy: [{ inStock: "desc" }, { createdAt: "desc" }],
      include: { category: true },
    });

    const prioritized = rows.sort((a, b) => {
      const aPriority = /nintendo|switch/i.test(a.category?.slug ?? "") ? 0 : 1;
      const bPriority = /nintendo|switch/i.test(b.category?.slug ?? "") ? 0 : 1;

      if (aPriority !== bPriority) return aPriority - bPriority;
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return prioritized.slice(skip, skip + take);
  }, []);
};

export const getProductBySlug = cache(async (slug: string) => {
  return safeQuery(
    () => prisma.product.findUnique({ where: { slug }, include: { category: true } }),
    null
  );
});

export const getNewProducts = cache(async (take: number = 8) => {
  return safeQuery(
    () => prisma.product.findMany({
      where: { ...VISIBLE, isNew: true },
      take,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    []
  );
});

export const getAllProducts = cache(async (take: number = 48) => {
  return safeQuery(
    () => prisma.product.findMany({
      where: VISIBLE,
      take,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    []
  );
});

export const getProductsCount = async (where: Prisma.ProductWhereInput) => {
  return safeQuery(
    () => prisma.product.count({ where: { AND: [VISIBLE, where] } }),
    0
  );
};

export interface CatalogVariantFilters {
  colors: Array<{ name: string; hex: string }>;
  memories: string[];
}

export const getCatalogVariantFilters = async (categorySlugs: string[]) => {
  return safeQuery(async () => {
    const categoryFilter = categorySlugs.length
      ? { category: { slug: { in: categorySlugs } } }
      : {};

    const allVisibleRows = await prisma.product.findMany({
      where: { AND: [VISIBLE, categoryFilter] },
      select: { attributes: true },
    });

    const inStockRows = await prisma.product.findMany({
      where: { AND: [VISIBLE, { inStock: true }, categoryFilter] },
      select: { color: true, attributes: true },
    });

    const allColors = await prisma.color.findMany({ orderBy: { name: "asc" } });

    // Memory from ALL visible products — only add real values, skip products without memory
    const memorySet = new Set<string>();
    for (const row of allVisibleRows) {
      const memoryValue = readAttribute(row.attributes, ATTRIBUTE_MEMORY_KEYS);
      if (memoryValue) memorySet.add(memoryValue);
    }

    // Collect colors that have in-stock products (for sort ordering)
    const categoryColorSet = new Set<string>();
    for (const row of inStockRows) {
      const colorValue = normalizeColor(
        readAttribute(row.attributes, ATTRIBUTE_COLOR_KEYS) ?? row.color ?? null
      );
      if (colorValue) categoryColorSet.add(colorValue);
    }

    // Return ALL colors from the Color table.
    // Colors that have in-stock products in current category come first, rest follow alphabetically.
    const colors = allColors
      .sort((a, b) => {
        const aHasProducts = categoryColorSet.has(a.name) ? 0 : 1;
        const bHasProducts = categoryColorSet.has(b.name) ? 0 : 1;
        if (aHasProducts !== bHasProducts) return aHasProducts - bHasProducts;
        return a.name.localeCompare(b.name, "ru");
      })
      .map((c) => ({ name: c.name, hex: c.hex }));

    // Sort memories naturally: "Не указана" first, then numeric ascending
    const memorySorted = Array.from(memorySet).sort((a, b) => {
      if (a === "Не указана") return -1;
      if (b === "Не указана") return 1;
      return (parseInt(a) || 0) - (parseInt(b) || 0);
    });

    return {
      colors,
      memories: memorySorted,
    } as CatalogVariantFilters;
  }, { colors: [], memories: [] } as CatalogVariantFilters);
};

export const getOrdersCount = cache(async () => {
  return safeQuery(() => prisma.order.count(), 0);
});

export const getRecentOrders = cache(async (take: number = 5) => {
  return safeQuery(
    () => prisma.order.findMany({ take, orderBy: { createdAt: "desc" } }),
    []
  );
});

export interface ProductVariantOption {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  priceOld: number | null;
  showOtherPaymentPrice: boolean;
  inStock: boolean;
  images: string[];
  memory: string | null;
  color: string | null;
  colorHex: string | null;
}

const ATTRIBUTE_MEMORY_KEYS = ["Накопитель", "Объём", "Объем"] as const;
const ATTRIBUTE_COLOR_KEYS = ["Цвет"] as const;

const COLOR_NORMALIZE: Record<string, string> = {
  white: "Белый",
  black: "Чёрный",
  red: "Красный",
  blue: "Синий",
  yellow: "Жёлтый",
  green: "Зелёный",
  gray: "Серый",
  grey: "Серый",
  coral: "Коралловый",
  pink: "Розовый",
  purple: "Фиолетовый",
  gold: "Золотой",
  silver: "Серебристый",
};

const normalizeColor = (color: string | null): string | null => {
  if (!color) return null;
  const key = color.toLowerCase().trim();
  return COLOR_NORMALIZE[key] ?? color;
};

const BUNDLE_MARKERS = [
  "+",
  "bundle",
  "бандл",
  "комплект",
  "game pass",
  "геймпад",
  "подписк",
  "игра",
  "edition",
  "limited",
  "fifa",
  "fortnite",
  "hogwarts",
  "zelda",
  "mario",
  "spider",
] as const;

const readAttribute = (
  attributes: Prisma.JsonValue | null,
  keys: readonly string[]
): string | null => {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return null;
  }

  for (const key of keys) {
    const value = (attributes as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

const isBaseVariantCandidate = (name: string, slug: string) => {
  const source = `${name} ${slug}`.toLowerCase();
  return !BUNDLE_MARKERS.some((marker) => source.includes(marker));
};

const hasVariants = (items: ProductVariantOption[]) => {
  const memoryCount = new Set(items.map((item) => item.memory).filter(Boolean)).size;
  const colorCount = new Set(items.map((item) => item.color).filter(Boolean)).size;
  return memoryCount > 1 || colorCount > 1;
};

export const getProductVariants = cache(async (productId: number) => {
  return safeQuery(async () => {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        attributes: true,
      },
    });

    if (!current) return [];

    const variantGroupId = readAttribute(current.attributes, ["__variantGroupId"]);
    const platform = readAttribute(current.attributes, ["Платформа"]);

    const whereClause = variantGroupId
      ? { AND: [VISIBLE, { attributes: { path: ["__variantGroupId"], equals: variantGroupId } }] }
      : platform
      ? { AND: [VISIBLE, { categoryId: current.categoryId }, { attributes: { path: ["Платформа"], equals: platform } }] }
      : null;

    if (!whereClause) return [];

    const familyPool = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        priceOld: true,
        showOtherPaymentPrice: true,
        inStock: true,
        images: true,
        color: true,
        colorHex: true,
        attributes: true,
      },
      orderBy: { price: "asc" },
    });

    const rawVariants: ProductVariantOption[] = familyPool.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      price: item.price,
      priceOld: item.priceOld ?? null,
      showOtherPaymentPrice: item.showOtherPaymentPrice ?? false,
      inStock: item.inStock,
      images: item.images,
      memory: readAttribute(item.attributes, ATTRIBUTE_MEMORY_KEYS),
      color: normalizeColor(
        readAttribute(item.attributes, ATTRIBUTE_COLOR_KEYS) ?? item.color ?? null
      ),
      colorHex: item.colorHex ?? null,
    }));

    // Deduplicate by (color, memory): keep the current product if duplicated, otherwise first (cheapest)
    const seen = new Map<string, ProductVariantOption>();
    for (const v of rawVariants) {
      const key = `${v.color ?? ""}|${v.memory ?? ""}`;
      if (!seen.has(key) || v.id === productId) {
        seen.set(key, v);
      }
    }
    const variants = Array.from(seen.values());

    return hasVariants(variants) ? variants : [];
  }, [] as ProductVariantOption[]);
});
