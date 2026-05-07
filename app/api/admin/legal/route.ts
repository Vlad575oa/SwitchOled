import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { revalidatePath } from "next/cache";

const LEGAL_DIR = join(process.cwd(), "content", "legal");
const SLUGS = ["offer", "privacy", "terms", "cookies"] as const;

async function readLegal(slug: string) {
  try {
    const raw = await readFile(join(LEGAL_DIR, `${slug}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return { title: "", description: "", sections: [] };
  }
}

export async function GET() {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result: Record<string, unknown> = {};
  for (const slug of SLUGS) {
    result[slug] = await readLegal(slug);
  }
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    for (const slug of SLUGS) {
      if (body[slug]) {
        await writeFile(
          join(LEGAL_DIR, `${slug}.json`),
          JSON.stringify(body[slug], null, 2),
          "utf-8"
        );
        revalidatePath(`/legal/${slug}`);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
