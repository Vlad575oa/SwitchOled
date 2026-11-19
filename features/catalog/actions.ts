"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface FilterParams {
  category: string;
  priceMin?: number;
  priceMax?: number;
  colors?: string[];
  memories?: string[];
  games?: string[];
  statuses?: string[];
}

export async function getFilteredProductsCountAction(params: FilterParams) {
  const { category, priceMin, priceMax, colors, memories, games, statuses } = params;

  try {
    const andConditions: Prisma.ProductWhereInput[] = [{ inStock: true }];

    if (category && category !== "all") {
      const cat = await prisma.category.findUnique({
        where: { slug: category },
        include: { children: true },
      });
      if (cat) {
        const categoryIds = [cat.id, ...cat.children.map((c) => c.id)];
        andConditions.push({ categoryId: { in: categoryIds } });
      }
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      andConditions.push({
        price: {
          ...(priceMin !== undefined ? { gte: priceMin * 100 } : {}),
          ...(priceMax !== undefined ? { lte: priceMax * 100 } : {}),
        },
      });
    }

    if (colors && colors.length > 0) {
      andConditions.push({ color: colors.length === 1 ? colors[0] : { in: colors } });
    }

    if (memories && memories.length > 0) {
      andConditions.push({
        OR: memories.flatMap((value) => ([
          { attributes: { path: ["Накопитель"], string_contains: value } },
          { attributes: { path: ["Объём"], string_contains: value } },
          { attributes: { path: ["Объем"], string_contains: value } },
        ])),
      });
    }

    if (games && games.length > 0) {
      andConditions.push({
        OR: games.map((value) => ({ attributes: { path: ["Игр в комплекте"], equals: value } })),
      });
    }

    // Catalog always displays only in-stock products (enforced in andConditions above).

    const where: Prisma.ProductWhereInput =
      andConditions.length > 0
        ? { isVisible: { not: false }, AND: andConditions }
        : { isVisible: { not: false } };

    const count = await prisma.product.count({ where });
    return { success: true, count };
  } catch (error) {
    console.error("Count Action Error:", error);
    return { success: false, error: "Failed to count products" };
  }
}
