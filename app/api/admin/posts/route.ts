import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadImagesToS3 } from "@/lib/s3";

const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
  х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .split("")
    .map((c) => TRANSLIT[c] ?? c)
    .join("")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  try {
    const fd = await request.formData();
    const title = fd.get("title") as string;
    const excerpt = (fd.get("excerpt") as string) || null;
    const content = fd.get("content") as string;
    const category = (fd.get("category") as string) || "Статья";
    const isPublished = fd.get("isPublished") === "true";
    const metaTitle = (fd.get("metaTitle") as string) || null;
    const metaDesc = (fd.get("metaDesc") as string) || null;

    let imageUrl: string | null = (fd.get("imageUrl") as string) || null;
    const imageFile = fd.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const [url] = await uploadImagesToS3([imageFile], "posts");
      imageUrl = url;
    }

    let slug = slugify(title);
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const post = await prisma.post.create({
      data: { title, slug, excerpt, content, category, isPublished, image: imageUrl, metaTitle, metaDesc },
    });
    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
