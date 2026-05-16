import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
      // Get all categories with their parentId and direct product count
      const all = await prisma.category.findMany({
        select: { id: true, slug: true, parentId: true, _count: { select: { products: { where: VISIBLE } } } },
      });

      const withProducts = new Set(all.filter((c) => c._count.products > 0).map((c) => c.id));

      // Walk up: if a child has products, mark its parent (and grandparent) as valid too
      for (const cat of all) {
        if (cat.parentId !== null && withProducts.has(cat.id)) {
          withProducts.add(cat.parentId);
          // one more level up (grandparent)
          const parent = all.find((c) => c.id === cat.parentId);
          if (parent?.parentId !== null && parent?.parentId != null) withProducts.add(parent.parentId);
        }
      }

      return all.filter((c) => withProducts.has(c.id)).map((c) => c.slug);
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
      const aPriority = /nintendo|switch/i.test(a.category.slug) ? 0 : 1;
      const bPriority = /nintendo|switch/i.test(b.category.slug) ? 0 : 1;

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
  colors: string[];
  memories: string[];
}

export const getCatalogVariantFilters = async (categorySlugs: string[]) => {
  return safeQuery(async () => {
    const categoryFilter = categorySlugs.length
      ? { category: { slug: { in: categorySlugs } } }
      : {};

    const rows = await prisma.product.findMany({
      where: {
        AND: [
          VISIBLE,
          { inStock: true },
          categoryFilter,
        ],
      },
      select: {
        color: true,
        attributes: true,
      },
    });

    const colorSet = new Set<string>();
    const memorySet = new Set<string>();

    for (const row of rows) {
      const colorValue = normalizeColor(
        readAttribute(row.attributes, ATTRIBUTE_COLOR_KEYS) ?? row.color ?? null
      );
      if (colorValue) colorSet.add(colorValue);

      const memoryValue = readAttribute(row.attributes, ATTRIBUTE_MEMORY_KEYS);
      if (memoryValue) memorySet.add(memoryValue);
    }

    return {
      colors: Array.from(colorSet),
      memories: Array.from(memorySet),
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

    const platform = readAttribute(current.attributes, ["Платформа"]);
    if (!platform) return [];

    const familyPool = await prisma.product.findMany({
      where: {
        AND: [
          VISIBLE,
          { categoryId: current.categoryId },
          { attributes: { path: ["Платформа"], equals: platform } },
        ],
      },
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
        attributes: true,
      },
      orderBy: { price: "asc" },
    });

    const baseOnly = familyPool.filter((item) =>
      isBaseVariantCandidate(item.name, item.slug)
    );
    const currentIsBase = isBaseVariantCandidate(current.name, current.slug);
    const filtered = currentIsBase ? baseOnly : familyPool;

    const rawVariants: ProductVariantOption[] = filtered.map((item) => ({
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
