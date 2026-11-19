// Run: node scripts/upsert-switcholed-articles-2026-11.mjs           — dry run, только чтение
//      node scripts/upsert-switcholed-articles-2026-11.mjs --apply   — создать/обновить статьи
//
// Публикует статьи ноября 2026 в блог: текст берётся из content/articles/<slug>.md,
// обложки уже лежат в S3 под switcholed/posts/.
// БД пишется через pg, а не Prisma: сервер принимает только TLS 1.3, а движок
// Prisma на macOS его не умеет. Установка: npm i --no-save pg

import "dotenv/config";
import fs from "fs";
import path from "path";

const APPLY = process.argv.includes("--apply");
const S3 = "https://s3.twcstorage.ru/f0f1f2a0-a633-4043-b632-47f3cade91b3/switcholed/posts";

const posts = [
  {
    slug: "nintendo-indie-world-oktyabr-2026",
    title: "Nintendo Indie World октябрь 2026: дата Witchbrook, игра автора Celeste и R.E.P.O.",
    category: "Новость",
    image: `${S3}/1795070038425-291e81ff-f1d4-4050-94ce-3f3557e7a69d.webp`,
    createdAt: "2026-10-29T12:00:00+03:00",
    metaTitle: "Indie World октябрь 2026: все анонсы для Switch и Switch 2 | Switch OLED",
    metaDesc: "Witchbrook выходит 28 января 2027, City of None от соавтора Celeste, R.E.P.O. на Switch 2 и уютные новинки. Все главные анонсы Indie World 28 октября.",
    excerpt: "Witchbrook получила дату выхода, соавтор Celeste показал City of None, а R.E.P.O. добирается до Switch 2. Главное с Indie World 28 октября 2026.",
  },
  {
    slug: "nintendo-otchet-noyabr-2026-switch-2-prodazhi",
    title: "Отчёт Nintendo: продажи Switch 2 упали на 41%, а прибыль выросла",
    category: "Новость",
    image: `${S3}/1795070037759-1bb5d43d-eba3-4635-85be-df4013adbf8d.webp`,
    createdAt: "2026-11-06T12:00:00+03:00",
    metaTitle: "Отчёт Nintendo ноябрь 2026: Switch 2 — 26,35 млн, продажи −41% | Switch OLED",
    metaDesc: "Nintendo продала 2,67 млн Switch 2 за квартал — на 41% меньше. Почему: подорожание консоли и памяти. Все цифры отчёта от 5 ноября 2026 и прогноз.",
    excerpt: "Switch 2 продана тиражом 26,35 млн, но за квартал продажи упали на 41% из-за подорожания консоли и памяти. Разбираем отчёт Nintendo от 5 ноября.",
  },
  {
    slug: "nintendo-switch-157-millionov-rekord-ps2",
    title: "Nintendo Switch — 157,2 млн: первая Switch почти догнала PlayStation 2",
    category: "Новость",
    image: `${S3}/1795070038078-2f3452a5-a676-44ac-9b1d-195afe400fd4.webp`,
    createdAt: "2026-11-09T12:00:00+03:00",
    metaTitle: "Nintendo Switch продана тиражом 157,2 млн — рядом рекорд PS2 | Switch OLED",
    metaDesc: "Первая Switch продана тиражом 157,20 млн, а продажи игр для неё выросли на 6,8%. Почему Switch OLED всё ещё актуальна в 2026 году.",
    excerpt: "Первая Switch добралась до 157,20 млн консолей и вплотную подошла к рекорду PS2. Продажи игр для неё даже растут — объясняем почему.",
  },
  {
    slug: "zelda-ocarina-of-time-remake-switch-2",
    title: "Ремейк Zelda: Ocarina of Time для Switch 2 — 5,2 млн копий за 4 дня",
    category: "Новость",
    image: `${S3}/1795070037320-aed8bc81-f19f-4b3a-ab95-45eb29e49316.webp`,
    createdAt: "2026-11-13T12:00:00+03:00",
    metaTitle: "Zelda: Ocarina of Time ремейк на Switch 2: продажи, что нового | Switch OLED",
    metaDesc: "Ремейк Ocarina of Time вышел 5 ноября 2026 на Switch 2 и продался тиражом 5,2 млн за 4 дня. Графика, озвучка, прыжок, окарина через микрофон и оценки.",
    excerpt: "Полноценный ремейк Ocarina of Time вышел на Switch 2 и за четыре дня разошёлся тиражом более 5,2 млн. Что изменилось и как его оценили критики.",
  },
  {
    slug: "igry-noyabrya-2026-switch-switch-2",
    title: "Игры ноября 2026 для Switch и Switch 2: Zelda, Metaphor, Pikmin 4 и другие",
    category: "Новость",
    image: `${S3}/1795070038907-6b037de5-9b6c-4ae8-be2b-fbb59f01f3a2.webp`,
    createdAt: "2026-11-17T12:00:00+03:00",
    metaTitle: "Новые игры ноября 2026 для Nintendo Switch и Switch 2 | Switch OLED",
    metaDesc: "Календарь релизов ноября 2026: ремейк Ocarina of Time, Metaphor: ReFantazio, Pikmin 4 Switch 2 Edition, Stellar Blade, SONIC PICO PARK и другие игры.",
    excerpt: "Ремейк Ocarina of Time, Metaphor: ReFantazio, улучшенная Pikmin 4 и порты крупных игр — все заметные релизы ноября для Switch 2 и первой Switch.",
  },
  {
    slug: "gta-5-na-nintendo-switch-oled",
    title: "GTA 5 на Nintendo Switch OLED — готовая консоль с игрой и подборкой на выбор",
    category: "Гайды",
    image: `${S3}/1795069646094-49200d74-f395-42f8-bee2-b62708ff00e8.webp`,
    createdAt: "2026-11-19T10:00:00+03:00",
    metaTitle: "Nintendo Switch OLED с GTA 5 — консоль с играми на выбор | Switch OLED",
    metaDesc: "Прошитая Nintendo Switch OLED с GTA 5 и другими играми по вашему списку. Какой объём памяти выбрать, проверка перед выдачей, гарантия 1 год.",
    excerpt: "Как получить Nintendo Switch OLED с GTA 5: какой объём памяти выбрать, какие игры установить вместе с ней и как мы готовим консоль.",
  },
  {
    slug: "gta-6-vyshla-kakuyu-ps5-kupit",
    title: "GTA 6 вышла: что важно знать и какую PS5 выбрать",
    category: "Новость",
    image: `${S3}/1795069750693-937df7b2-4867-4db7-a4a5-dee613b88e6f.webp`,
    createdAt: "2026-11-19T12:00:00+03:00",
    metaTitle: "GTA 6 вышла на PS5: 212 ГБ, русский текст и какую консоль купить | Switch OLED",
    metaDesc: "GTA VI вышла 19 ноября 2026. Сколько места нужно на PS5, есть ли русский язык, что в коробке и какую PS5 выбрать: Slim, Digital или Pro с GTA VI.",
    excerpt: "GTA VI вышла 19 ноября 2026 года. Что нового в игре, сколько места освободить на PS5 и какую консоль выбрать, если её у вас пока нет.",
  },
];

let pg;
try {
  pg = (await import("pg")).default;
} catch {
  console.error("❌ Нет пакета pg. Установите без изменения package.json: npm i --no-save pg");
  process.exit(1);
}
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log(`${APPLY ? "✍️  APPLY" : "🔎 DRY RUN"}: ${posts.length} статей\n`);
  await db.connect();

  for (const post of posts) {
    const file = path.join(process.cwd(), "content/articles", `${post.slug}.md`);
    const content = fs.readFileSync(file, "utf8").trim();
    const { rows } = await db.query(`SELECT id FROM "Post" WHERE slug = $1`, [post.slug]);
    const action = rows.length ? `обновить #${rows[0].id}` : "создать";
    console.log(`  ${action}: ${post.slug} (${content.length} символов)`);

    if (!APPLY) continue;
    await db.query(
      `INSERT INTO "Post" (title, slug, excerpt, content, image, "isPublished", "metaTitle", "metaDesc", category, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
         image = EXCLUDED.image, "isPublished" = true, "metaTitle" = EXCLUDED."metaTitle",
         "metaDesc" = EXCLUDED."metaDesc", category = EXCLUDED.category, "updatedAt" = NOW()`,
      [post.title, post.slug, post.excerpt, content, post.image, post.metaTitle, post.metaDesc, post.category, new Date(post.createdAt)]
    );
  }

  console.log(APPLY ? "\n✅ Готово" : "\nЭто был dry run. Для записи: node scripts/upsert-switcholed-articles-2026-11.mjs --apply");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end().catch(() => {}));
