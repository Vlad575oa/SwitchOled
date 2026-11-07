import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeS3ObjectUrl } from "@/lib/imageUrls";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) return NextResponse.json([]);

    const ids = idsParam
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);

    if (ids.length === 0) return NextResponse.json([]);

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { category: true },
      take: 12,
    });

    // Return in the same order as requested IDs
    const map = new Map(products.map((p) => [p.id, p]));
    const ordered = ids
      .map((id) => map.get(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .map((product) => ({
        ...product,
        images: product.images.map((image) =>
          normalizeS3ObjectUrl(image, process.env.S3_BUCKET ?? "")
        ),
      }));

    return NextResponse.json(ordered);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
