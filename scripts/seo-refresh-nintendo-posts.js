const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const HUB_URL = "/catalog/nintendo-switch-oled";
const START_MARKER = "<!-- SEO_AUTOBLOCK_START -->";
const END_MARKER = "<!-- SEO_AUTOBLOCK_END -->";

function sanitizeContent(content = "") {
  const re = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, "g");
  return content.replace(re, "").trim();
}

function pickFeatured(skus, idx) {
  const size = skus.length;
  return [skus[idx % size], skus[(idx + 3) % size], skus[(idx + 6) % size]];
}

function comparisonTable() {
  return [
    "### Сравнение конфигураций Nintendo Switch OLED",
    "",
    "| Конфигурация | Для кого | Что получаете |",
    "|---|---|---|",
    "| 64GB + 15 игр | Стартовый вариант | Минимальный вход, базовая библиотека |",
    "| 128GB + 30 игр | Оптимальный баланс | Больше тайтлов без переплаты |",
    "| 256GB + 50 игр | Активный игрок | Широкий набор игр и запас по памяти |",
    "| 512GB + 100 игр | Максимум без компромиссов | Топовый комплект для долгой игры |",
    "",
  ].join("\n");
}

function trustBlock() {
  return [
    "### Гарантии и условия покупки",
    "",
    "- Гарантия на консоль и проверка перед отправкой.",
    "- Прозрачные условия оплаты и подтверждение заказа перед отправкой.",
    "- Доставка по РФ, трек-номер и контроль статуса.",
    "- Поддержка по возврату и обмену по правилам магазина.",
    "",
  ].join("\n");
}

function introBlock(featured) {
  return [
    "### Купить прошитую Nintendo Switch OLED в наличии",
    "",
    `- [Смотреть все варианты OLED в наличии](${HUB_URL})`,
    `- [Купить ${featured[0].anchorBase}](${featured[0].url})`,
    `- [Купить ${featured[1].anchorBase}](${featured[1].url})`,
    `- [Купить ${featured[2].anchorBase}](${featured[2].url})`,
    "",
    "> Актуальные цены и наличие обновляются в карточках товаров.",
    "",
  ].join("\n");
}

function outroBlock(featured) {
  return [
    "### Выбор и заказ",
    "",
    "Если нужен быстрый выбор без лишних сравнений, ориентируйтесь на объем комплекта и цвет (White/Neon).",
    `Перед заказом проверьте [все актуальные OLED-конфигурации](${HUB_URL}) и сравните карточки:`,
    "",
    `- [${featured[0].anchorBase}: купить, цена, в наличии](${featured[0].url})`,
    `- [${featured[1].anchorBase}: купить, цена, в наличии](${featured[1].url})`,
    `- [${featured[2].anchorBase}: купить, цена, в наличии](${featured[2].url})`,
    "",
  ].join("\n");
}

function thinExpansion() {
  return [
    "### Как выбрать конфигурацию без переплаты",
    "",
    "Для большинства покупателей ключевой критерий — объем комплекта и сценарий использования. Если вы играете нерегулярно и хотите просто начать, хватит базового варианта 64GB + набор игр. Для стабильной игры 3–4 вечера в неделю обычно удобнее 128GB или 256GB: не нужно часто пересобирать библиотеку и проще переключаться между проектами.",
    "",
    "Если вы выбираете консоль «на вырост» или покупаете в подарок, логично смотреть на 512GB + расширенный набор игр. Такой вариант закрывает вопрос по контенту на старте и экономит время на дальнейших покупках. По цвету и внешнему виду ориентируйтесь на личные предпочтения: White и Neon отличаются визуально, но по базовому пользовательскому сценарию выбор делается в первую очередь по комплекту и итоговой цене.",
    "",
    "Перед оформлением заказа проверяйте карточку товара: текущую цену, наличие, состав комплекта и условия доставки. Это поможет выбрать оптимальный вариант под ваш бюджет и избежать лишних трат.",
    "",
  ].join("\n");
}

async function main() {
  const posts = await prisma.post.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      metaTitle: true,
      metaDesc: true,
    },
  });

  const nintendoPosts = posts.filter((p) =>
    /(nintendo|switch|нинтендо|свитч)/i.test(`${p.title} ${p.slug} ${p.content || ""}`)
  );

  const skusRaw = await prisma.product.findMany({
    where: { isVisible: { not: false }, inStock: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: { category: true },
  });

  const skus = skusRaw.map((s) => {
    const anchorBase = s.name
      .replace(/^Прошитая\\s+/i, "прошитую ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      ...s,
      anchorBase,
      url: `/catalog/${s.category.slug}/${s.slug}`,
    };
  });

  for (let i = 0; i < nintendoPosts.length; i += 1) {
    const post = nintendoPosts[i];
    const featured = pickFeatured(skus, i);
    const clean = sanitizeContent(post.content || "");
    const words = clean.split(/\s+/).filter(Boolean).length;

    const head = [
      START_MARKER,
      introBlock(featured),
      comparisonTable(),
      trustBlock(),
      END_MARKER,
      "",
    ].join("\n");

    const tail = [
      "",
      START_MARKER,
      outroBlock(featured),
      END_MARKER,
    ].join("\n");

    const extra = words < 300 ? `\n\n${thinExpansion()}` : "";
    const nextContent = `${head}${clean}${extra}${tail}`.trim();

    const data = { content: nextContent };
    if (post.slug === "всё-что-нужно-знать-о-прошитых-и-чипованных-консолях-nintendo-switch") {
      data.metaTitle =
        "Прошитая и чипованная Nintendo Switch в 2026: как выбрать, цена и что купить";
      data.metaDesc =
        "Разбираем прошитые и чипованные Nintendo Switch OLED: отличия, риски, конфигурации 64/128/256/512 GB, актуальные цены и варианты в наличии.";
    }

    await prisma.post.update({
      where: { id: post.id },
      data,
    });

    console.log(`UPDATED ${post.slug}`);
  }

  console.log(`DONE. Updated posts: ${nintendoPosts.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

