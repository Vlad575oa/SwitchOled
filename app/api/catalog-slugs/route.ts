import { NextResponse } from "next/server";
import { getCategorySlugsWithProducts } from "@/lib/queries";

export const revalidate = 300;

export async function GET() {
  const slugs = await getCategorySlugsWithProducts();
  return NextResponse.json(slugs);
}
