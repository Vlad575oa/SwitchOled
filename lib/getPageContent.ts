import prisma from "@/lib/prisma";

export async function getPageContent(section: string): Promise<Record<string, string>> {
  try {
    const row = await prisma.pageContent.findUnique({ where: { id: section } });
    return (row?.data as Record<string, string>) ?? {};
  } catch {
    return {};
  }
}
