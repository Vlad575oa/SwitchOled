import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  const raw = await readFile(join(process.cwd(), "content", "pages.json"), "utf-8");
  const pages = JSON.parse(raw) as Record<string, unknown>;

  for (const [section, data] of Object.entries(pages)) {
    await prisma.pageContent.upsert({
      where: { id: section },
      create: { id: section, data: data as any },
      update: { data: data as any },
    });
    console.log(`✓ ${section}`);
  }

  console.log("Migration complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());
