import prisma from "./lib/prisma.ts";

const COLOR_HEX = {
  "Белый":       "#F5F5F5",
  "Чёрный":      "#1A1A1A",
  "Синий":       "#2563EB",
  "Красный":     "#DC2626",
  "Жёлтый":      "#EAB308",
  "Зелёный":     "#16A34A",
  "Серый":       "#9CA3AF",
  "Розовый":     "#F472B6",
  "Бирюзовый":   "#06B6D4",
  "Коралловый":  "#FB7185",
  "Фиолетовый":  "#7C3AED",
  "Золотой":     "#CA8A04",
  "Серебристый": "#CBD5E1",
};

async function main() {
  console.log("Seeding colors...");
  for (const [name, hex] of Object.entries(COLOR_HEX)) {
    await prisma.color.upsert({
      where: { name },
      update: { hex },
      create: { name, hex },
    });
  }
  console.log("Colors seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
