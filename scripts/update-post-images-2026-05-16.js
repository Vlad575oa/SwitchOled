const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IMAGE_MAP = {
  "proshitaya-nintendo-switch-chto-eto-riski-komu-podhodit-2026":
    "/images/blog/2026-05-16/nintendo-switch-on-desk-2026-05-16.webp",
  "switch-2-vs-ps5-dlya-semi-rebenka-i-puteshestviy-2026":
    "/images/blog/2026-05-16/playstation-5-and-nintendo-switch-2026-05-16.webp",
  "top-aksessuarov-dlya-nintendo-v-pervyy-mesyats-2026":
    "/images/blog/2026-05-16/nintendo-switch-accessories-flatlay-2026-05-16.webp",
  "nintendo-switch-oled-dlya-rebenka-chek-list-pokupki-2026":
    "/images/blog/2026-05-16/nintendo-switch-oled-checklist-2026-05-16.webp",
};

const RANGE_START = new Date("2026-05-16T00:00:00+03:00");
const RANGE_END = new Date("2026-05-17T00:00:00+03:00");

async function main() {
  const slugs = Object.keys(IMAGE_MAP);

  const posts = await prisma.post.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, title: true, createdAt: true, image: true },
    orderBy: { createdAt: "asc" },
  });

  if (posts.length !== 4) {
    throw new Error(
      `Ожидалось 4 поста по slug, найдено: ${posts.length}. Проверьте данные перед обновлением.`
    );
  }

  const wrongDate = posts.filter(
    (p) => !(p.createdAt >= RANGE_START && p.createdAt < RANGE_END)
  );
  if (wrongDate.length > 0) {
    throw new Error(
      `Найдены посты вне даты 2026-05-16: ${wrongDate
        .map((p) => `${p.slug} (${p.createdAt.toISOString()})`)
        .join(", ")}`
    );
  }

  for (const post of posts) {
    const nextImage = IMAGE_MAP[post.slug];
    await prisma.post.update({
      where: { id: post.id },
      data: { image: nextImage },
    });
    console.log(
      `UPDATED\tid=${post.id}\tslug=${post.slug}\n  old=${post.image || "NULL"}\n  new=${nextImage}`
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
