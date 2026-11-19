// Run: node scripts/copy-referenced-s3-objects.mjs           — dry run, только чтение
//      node scripts/copy-referenced-s3-objects.mjs --apply   — скопировать объекты
//
// Собирает все ссылки на объекты S3_BUCKET, которые использует ЭТОТ проект
// (все текстовые/JSON/array-колонки БД + файлы content/, prisma/, app/ и т.д.),
// и копирует каждый объект в "<S3_KEY_PREFIX>/<старый ключ>" того же бакета.
// Ничего не удаляет и не меняет в БД: старые объекты остаются на месте,
// а карта "старый URL → новый URL" пишется в scratch/ для следующего шага.
//
// БД читается через pg, а не Prisma: сервер принимает только TLS 1.3, а движок
// Prisma на macOS (Security.framework) его не умеет. Установка: npm i --no-save pg

import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  S3Client,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");

const BUCKET = process.env.S3_BUCKET;
const ENDPOINT = process.env.S3_ENDPOINT;
const PUBLIC_URL = process.env.S3_PUBLIC_URL ?? ENDPOINT;
const KEY_PREFIX = (process.env.S3_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, "");

if (!BUCKET || !ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !KEY_PREFIX) {
  console.error("❌ Не заданы S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY или S3_KEY_PREFIX в .env");
  process.exit(1);
}

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "ru1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

let pg;
try {
  pg = (await import("pg")).default;
} catch {
  console.error("❌ Нет пакета pg. Установите без изменения package.json: npm i --no-save pg");
  process.exit(1);
}
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

const S3_HOSTS = new Set([new URL(ENDPOINT).host, new URL(PUBLIC_URL).host]);
const SCAN_DIRS = ["app", "components", "features", "entities", "widgets", "shared", "lib", "content", "prisma"];
const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".md", ".mdx", ".json"]);
// Comma is excluded: Postgres renders text[] as "{url1,url2}"
const URL_RE = /https?:\/\/[^\s"'`<>()[\]\\{},]+/g;

const objectUrl = (key) => `${PUBLIC_URL.replace(/\/+$/, "")}/${BUCKET}/${key}`;
const encodeKey = (key) => key.split("/").map(encodeURIComponent).join("/");

// key → Set of places it is referenced from; url → key
const refs = new Map();
const urlToKey = new Map();
// Ссылки на другие бакеты/хранилища (например, старый Beget) — их этим скриптом не скопировать
const foreign = new Map();

function addRef(map, id, where) {
  if (!map.has(id)) map.set(id, new Set());
  map.get(id).add(where);
}

function parseS3Key(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const segments = url.pathname.split("/").filter(Boolean).map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });

  // path-style: https://s3.twcstorage.ru/<bucket>/<key>
  if (S3_HOSTS.has(url.host) && segments[0] === BUCKET && segments.length > 1) {
    return segments.slice(1).join("/");
  }
  // virtual-hosted: https://<bucket>.s3.twcstorage.ru/<key>
  if ([...S3_HOSTS].some((h) => url.host === `${BUCKET}.${h}`) && segments.length) {
    return segments.join("/");
  }
  return null;
}

function collect(text, where) {
  for (const match of text.match(URL_RE) ?? []) {
    const rawUrl = match.replace(/[.,;:!?]+$/, "");
    const key = parseS3Key(rawUrl);
    if (key) {
      addRef(refs, key, where);
      urlToKey.set(rawUrl, key);
      continue;
    }
    let url;
    try { url = new URL(rawUrl); } catch { continue; }
    // Bare hosts (preconnect, CSP) are not objects
    if (url.pathname.length > 1 && /(^|\.)s3[.-]|storage\.|cdn/i.test(url.host)) addRef(foreign, rawUrl, where);
  }
}

async function scanDatabase() {
  await db.connect();
  const { rows: tables } = await db.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  for (const { table_name: table } of tables) {
    const { rows: columns } = await db.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
         AND (data_type IN ('text', 'character varying', 'json', 'jsonb', 'ARRAY'))`,
      [table]
    );
    for (const { column_name: column } of columns) {
      const { rows } = await db.query(
        `SELECT "${column}"::text AS v FROM "${table}" WHERE "${column}"::text LIKE $1`,
        ["%://%"]
      );
      for (const row of rows) collect(row.v ?? "", `db:${table}.${column}`);
      if (rows.length) console.log(`  db ${table}.${column}: ${rows.length} строк со ссылками`);
    }
  }
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (SCAN_EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function scanRepo() {
  let count = 0;
  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(process.cwd(), dir))) {
      collect(fs.readFileSync(file, "utf8"), `file:${path.relative(process.cwd(), file)}`);
      count++;
    }
  }
  console.log(`  просмотрено файлов проекта: ${count}`);
}

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

async function processKey(key) {
  const target = `${KEY_PREFIX}/${key}`;
  if (!(await exists(key))) return { key, status: "missing" };
  if (await exists(target)) return { key, target, status: "already" };
  if (!APPLY) return { key, target, status: "to-copy" };

  await s3.send(new CopyObjectCommand({
    Bucket: BUCKET,
    Key: target,
    CopySource: `${BUCKET}/${encodeKey(key)}`,
    MetadataDirective: "COPY",
    ACL: "public-read",
  }));
  return { key, target, status: "copied" };
}

// Небольшой пул, чтобы не делать тысячи HEAD-запросов строго по очереди
async function runPool(items, worker, size = 8) {
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const item = items[next++];
      try {
        results.push(await worker(item));
      } catch (err) {
        results.push({ key: item, status: "error", error: err.message });
      }
      if (results.length % 100 === 0) console.log(`  ${results.length}/${items.length}`);
    }
  }));
  return results;
}

async function main() {
  console.log(`${APPLY ? "🚚 APPLY" : "🔎 DRY RUN"}: bucket ${BUCKET}, prefix "${KEY_PREFIX}/"\n`);

  console.log("Читаем БД...");
  await scanDatabase();
  console.log("Читаем файлы проекта...");
  scanRepo();

  // Ключи, которые уже лежат под префиксом проекта, копировать не нужно
  const keys = [...refs.keys()].filter((k) => !k.startsWith(`${KEY_PREFIX}/`)).sort();
  const alreadyPrefixed = refs.size - keys.length;
  console.log(`\nУникальных объектов бакета: ${refs.size} (уже под префиксом: ${alreadyPrefixed}, к обработке: ${keys.length})`);
  console.log(`Ссылок на другие хранилища (не копируются): ${foreign.size}\n`);

  const results = await runPool(keys, processKey);
  const by = (status) => results.filter((r) => r.status === status);

  const urlMap = {};
  for (const [url, key] of urlToKey) {
    if (!key.startsWith(`${KEY_PREFIX}/`)) urlMap[url] = objectUrl(`${KEY_PREFIX}/${key}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    apply: APPLY,
    bucket: BUCKET,
    prefix: KEY_PREFIX,
    summary: {
      referenced: refs.size,
      alreadyPrefixed,
      toCopy: by("to-copy").length,
      copied: by("copied").length,
      alreadyCopied: by("already").length,
      missing: by("missing").length,
      errors: by("error").length,
      foreign: foreign.size,
    },
    missing: by("missing").map((r) => ({ key: r.key, from: [...refs.get(r.key)] })),
    errors: by("error"),
    foreign: [...foreign].map(([url, from]) => ({ url, from: [...from] })),
    urlMap,
    references: Object.fromEntries([...refs].map(([key, from]) => [key, [...from]])),
  };

  const outDir = path.join(process.cwd(), "scratch");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `s3-copy-${KEY_PREFIX}${APPLY ? "" : "-dry-run"}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log("\nИтог:", report.summary);
  if (report.missing.length) console.log("⚠️  Ссылки на отсутствующие объекты — см. missing в отчёте");
  if (report.errors.length) console.log("❌ Ошибки — см. errors в отчёте");
  console.log(`\nОтчёт: ${path.relative(process.cwd(), outFile)}`);
  if (!APPLY) console.log("Это был dry run. Для копирования: node scripts/copy-referenced-s3-objects.mjs --apply");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end().catch(() => {}));
