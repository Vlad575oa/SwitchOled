"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { buildProductSearchWhere } from "@/lib/search";

const VARIANT_GROUP_KEY = "__variantGroupId";

interface OrderItemInput {
  productId: number;
  quantity: number;
}

interface CreateOrderInput {
  name: string;
  phone: string;
  address: string;
  comment?: string | null;
  items: OrderItemInput[];
  userId?: number | null;
  yandexClientId?: string | null;
  yclid?: string | null;
}

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createOrderAction(input: CreateOrderInput): Promise<ActionResponse<any>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const normalizedItems = input.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }));
      if (!normalizedItems.length) {
        throw new Error("Корзина пуста");
      }
      if (normalizedItems.some((i) => !Number.isInteger(i.productId) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20)) {
        throw new Error("Некорректные позиции заказа");
      }

      const productIds = Array.from(new Set(normalizedItems.map((i) => i.productId)));
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true, name: true, price: true, inStock: true, isVisible: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // 1. Check visibility up front (fast-fail before touching rows)
      for (const item of normalizedItems) {
        const product = productMap.get(item.productId);
        if (!product || product.isVisible === false) {
          throw new Error(`Товар "${product?.name || "ID " + item.productId}" недоступен или закончился`);
        }
      }

      // 2. Atomically decrement stock, conditioned on sufficient stock at write
      // time. This closes the check-then-decrement race window: under
      // concurrent orders, only transactions whose conditional UPDATE actually
      // matches a row (stock >= quantity) succeed — the rest fail fast instead
      // of allowing stock to go negative.
      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)!;
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          throw new Error(`Товар "${product.name}" недоступен или закончился. Удалите его из корзины или выберите другой вариант.`);
        }

        const updatedProduct = await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true } });
        if (updatedProduct && updatedProduct.stock <= 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { inStock: false },
          });
        }
      }

      const orderItems = normalizedItems.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          productId: item.productId,
          product_name_at_purchase: product.name,
          quantity: item.quantity,
          price_at_purchase: product.price,
        };
      });
      const serverTotal = orderItems.reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0);
      if (serverTotal <= 0) {
        throw new Error("Некорректная сумма заказа");
      }

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          name: input.name,
          phone: input.phone,
          address: input.address,
          comment: input.comment ?? null,
          yandexClientId: input.yandexClientId ?? null,
          yclid: input.yclid ?? null,
          totalAmount: serverTotal,
          status: "pending",
          userId: input.userId ?? null,
          items: {
            create: orderItems,
          },
        },
      });

      return order;
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/catalog");
    } catch (err) {
      // revalidatePath might throw if run outside of Next.js environment (e.g. in tests)
      console.warn("revalidatePath skipped:", err instanceof Error ? err.message : err);
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Order Creation Error:", error.message);
    return { success: false, error: error.message || "Something went wrong" };
  }
}

export async function searchProductsAction(query: string) {
  try {
    const searchWhere = query && query.length >= 2 ? buildProductSearchWhere(query) : undefined;
    const products = await prisma.product.findMany({
      where: {
        isVisible: { not: false },
        ...(searchWhere ?? {}),
      },
      take: query && query.length >= 2 ? 8 : 4,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
      },
    });

    return products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.name,
      categorySlug: p.category.slug,
      image: p.images[0] || "",
    }));
  } catch (error: any) {
    console.error("Search Error:", error);
    return [];
  }
}

export async function duplicateProductAction(id: number): Promise<ActionResponse<any>> {
  try {
    const original = await prisma.product.findUnique({
      where: { id },
    });

    if (!original) {
      throw new Error("Товар не найден");
    }

    // Generate unique slug (strip any existing -copy-xxxx suffix first)
    const baseSlug = original.slug.replace(/-copy-[a-z0-9]+$/, "");
    const suffix = Math.random().toString(36).substring(2, 6);
    const newSlug = `${baseSlug}-copy-${suffix}`;

    // Create duplicate (excluding ID and timestamps)
    const { id: _, createdAt, updatedAt, ...rest } = original as any;
    const originalAttrs = (original.attributes ?? {}) as Record<string, unknown>;
    // Strip __variantGroupId so the copy groups by Platform like the rest of the family
    const { [VARIANT_GROUP_KEY]: _vgId, ...attrsWithoutGroupId } = originalAttrs;

    const duplicate = await prisma.product.create({
      data: {
        ...rest,
        slug: newSlug,
        name: `${original.name} (Копия)`,
        attributes: attrsWithoutGroupId,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/catalog");

    return { success: true, data: duplicate };
  } catch (error: any) {
    console.error("Duplication Error:", error);
    return { success: false, error: error.message || "Failed to duplicate product" };
  }
}

export async function togglePostPublishAction(id: number): Promise<ActionResponse<any>> {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { isPublished: true },
    });

    if (!post) {
      throw new Error("Статья не найдена");
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { isPublished: !post.isPublished },
    });

    revalidatePath("/admin/posts");
    revalidatePath("/blog");

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Toggle Publish Error:", error);
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}
