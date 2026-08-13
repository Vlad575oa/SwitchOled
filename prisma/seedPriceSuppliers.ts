import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const suppliers = [
  {
    slug: "amax",
    name: "AMAX",
    parserKey: "amax",
    detectPattern: { headerContains: ["Цена от 30шт"], fileNamePattern: "amax" },
  },
  {
    slug: "katana",
    name: "Katana",
    parserKey: "katana",
    detectPattern: { headerContains: ["Цена Карго Доставкой"], fileNamePattern: "katana" },
  },
  {
    slug: "wholesale",
    name: "Оптовый Прайс",
    parserKey: "wholesale",
    detectPattern: { headerContains: ["наличие"], fileNamePattern: "оптовый прайс" },
  },
  {
    slug: "games1c",
    name: "Прайс игры (1С)",
    parserKey: "games1c",
    detectPattern: { headerContains: ["Номенклатура.Родитель"], fileNamePattern: "прайс игры" },
  },
];

async function main() {
  for (const supplier of suppliers) {
    await prisma.priceSupplier.upsert({
      where: { slug: supplier.slug },
      update: { name: supplier.name, parserKey: supplier.parserKey, detectPattern: supplier.detectPattern },
      create: supplier,
    });
  }
  console.log("Price suppliers seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
