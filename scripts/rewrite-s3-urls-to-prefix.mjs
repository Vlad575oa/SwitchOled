// Run: node scripts/rewrite-s3-urls-to-prefix.mjs           — dry run, только чтение
//      node scripts/rewrite-s3-urls-to-prefix.mjs --apply   — переписать ссылки
//
// Шаг после copy-referenced-s3-objects.mjs: переводит ссылки этого проекта
// с общих объектов бакета "<ключ>" на его копии "<S3_KEY_PREFIX>/<ключ>"
// — во всех текстовых/JSON/text[] колонках БД и в файлах content/, prisma/, app/ и т.д.
// Ссылка меняется только если копия под префиксом реально существует.
// Перед записью старые значения сохраняются в scratch/s3-rewrite-<prefix>-backup-*.json.
// Сами объекты в бакете не трогаются.
//
// БД читается через pg (TLS 1.3, см. copy-referenced-s3-objects.mjs). Установка: npm i --no-save pg

import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");

const BUCKET = process.env.S3_BUCKET;
const ENDPOINT = process.env.S3_ENDPOINT;
const PUBLIC_URL = process.env.S3_PUBLIC_URL ?? ENDPOINT;
const KEY_PREFIX = (process.env.S3_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, "");

if (!BUCKET || !ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !KEY_PREFIX) {
  console.error("❌ Не заданы S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY или S3_KEY_PREFIX в .env");
  process.exit(1);
}

let pg;
try {
  pg = (await import("pg")).default;
} catch {
  console.error("❌ Нет пакета pg. Установите без изменения package.json: npm i --no-save pg");
  process.exit(1);
}
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "ru1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const S3_HOSTS = new Set([new URL(ENDPOINT).host, new URL(PUBLIC_URL).host]);
const SCAN_DIRS = ["app", "components", "features", "entities", "widgets", "shared", "lib", "content", "prisma"];
const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".md", ".mdx", ".json"]);
// Comma is excluded: Postgres renders text[] as "{url1,url2}"
const URL_RE = /https?:\/\/[^\s"'`<>()[\]\\{},]+/g;
const TRAILING_RE = /[.,;:!?]+$/;

const objectUrl = (key) => `${PUBLIC_URL.replace(/\/+$/, "")}/${BUCKET}/${key}`;
const quote = (name) => `"${name.replace(/"/g, '""')}"`;

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
    // normalizeS3ObjectUrl: tolerate a duplicated bucket segment
    const rest = segments[1] === BUCKET ? segments.slice(2) : segments.slice(1);
    return rest.length ? rest.join("/") : null;
  }
  // virtual-hosted: https://<bucket>.s3.twcstorage.ru/<key>
  if ([...S3_HOSTS].some((h) => url.host === `${BUCKET}.${h}`) && segments.length) {
    return segments.join("/");
  }
  return null;
}

// Keys that still point at shared (unprefixed) objects
function sharedKeysIn(text) {
  const keys = [];
  for (const match of text.match(URL_RE) ?? []) {
    const key = parseS3Key(match.replace(TRAILING_RE, ""));
    if (key && !key.startsWith(`${KEY_PREFIX}/`)) keys.push(key);
  }
  return keys;
}

// Filled after HEAD checks: only keys whose prefixed copy exists are rewritten
const copied = new Set();

function rewrite(text) {
  return text.replace(URL_RE, (match) => {
    const rawUrl = match.replace(TRAILING_RE, "");
    const tail = match.slice(rawUrl.length);
    const key = parseS3Key(rawUrl);
    if (!key || key.startsWith(`${KEY_PREFIX}/`) || !copied.has(key)) return match;
    return objectUrl(`${KEY_PREFIX}/${key}`) + tail;
  });
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

// Небольшой пул, чтобы не делать сотни HEAD-запросов строго по очереди
async function runPool(items, worker, size = 8) {
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) await worker(items[next++]);
  }));
}

async function loadColumns() {
  const { rows } = await db.query(`
    SELECT c.table_name, c.column_name, c.data_type, c.udt_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND (c.data_type IN ('text', 'character varying', 'json', 'jsonb')
           OR (c.data_type = 'ARRAY' AND c.udt_name IN ('_text', '_varchar')))
    ORDER BY c.table_name, c.ordinal_position`);
  return rows;
}

async function primaryKey(table) {
  const { rows } = await db.query(`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'`,
    [table]);
  return rows.length === 1 ? rows[0].column_name : null;
}

function rewriteValue(value, column) {
  if (column.data_type === "ARRAY") return value.map((item) => (typeof item === "string" ? rewrite(item) : item));
  if (column.data_type === "json" || column.data_type === "jsonb") return JSON.parse(rewrite(JSON.stringify(value)));
  return rewrite(value);
}

function serialize(value, column) {
  return column.data_type === "json" || column.data_type === "jsonb" ? JSON.stringify(value) : value;
}

function castFor(column) {
  if (column.data_type === "ARRAY") return column.udt_name === "_varchar" ? "varchar[]" : "text[]";
  if (column.data_type === "json" || column.data_type === "jsonb") return column.data_type;
  return "text";
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

async function main() {
  console.log(`${APPLY ? "✍️  APPLY" : "🔎 DRY RUN"}: bucket ${BUCKET}, prefix "${KEY_PREFIX}/"\n`);
  await db.connect();

  // 1. Collect candidate rows and files
  const columns = await loadColumns();
  const rowsByColumn = [];
  const allKeys = new Set();

  for (const column of columns) {
    const { rows } = await db.query(
      `SELECT ${quote(column.column_name)} AS v, ${quote(column.column_name)}::text AS raw, ctid::text AS ctid
       FROM ${quote(column.table_name)} WHERE ${quote(column.column_name)}::text LIKE $1`,
      ["%://%"]
    );
    const candidates = rows.filter((r) => sharedKeysIn(r.raw).length);
    if (!candidates.length) continue;
    candidates.forEach((r) => sharedKeysIn(r.raw).forEach((k) => allKeys.add(k)));
    rowsByColumn.push({ column, rows: candidates });
  }

  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(process.cwd(), dir)))
    .map((file) => ({ file, text: fs.readFileSync(file, "utf8") }))
    .filter(({ text }) => sharedKeysIn(text).length);
  files.forEach(({ text }) => sharedKeysIn(text).forEach((k) => allKeys.add(k)));

  // 2. Rewrite only keys whose prefixed copy exists
  const missing = [];
  await runPool([...allKeys], async (key) => {
    if (await exists(`${KEY_PREFIX}/${key}`)) copied.add(key);
    else missing.push(key);
  });
  console.log(`Общих объектов в ссылках: ${allKeys.size}, копия под префиксом есть: ${copied.size}, нет копии: ${missing.length}`);

  // 3. Plan changes
  const dbChanges = [];
  for (const { column, rows } of rowsByColumn) {
    const pk = await primaryKey(column.table_name);
    let pkValues = new Map();
    if (pk) {
      const { rows: pkRows } = await db.query(
        `SELECT ctid::text AS ctid, ${quote(pk)}::text AS pk FROM ${quote(column.table_name)} WHERE ctid::text = ANY($1)`,
        [rows.map((r) => r.ctid)]
      );
      pkValues = new Map(pkRows.map((r) => [r.ctid, r.pk]));
    }
    let count = 0;
    for (const row of rows) {
      const next = rewriteValue(row.v, column);
      if (JSON.stringify(next) === JSON.stringify(row.v)) continue;
      if (!pk) {
        console.log(`  ⚠️  ${column.table_name}.${column.column_name}: нет первичного ключа, пропуск`);
        break;
      }
      dbChanges.push({ column, pk, pkValue: pkValues.get(row.ctid), raw: row.raw, next });
      count++;
    }
    if (count) console.log(`  db ${column.table_name}.${column.column_name}: ${count} строк`);
  }

  const fileChanges = files
    .map(({ file, text }) => ({ file, text, next: rewrite(text) }))
    .filter(({ text, next }) => next !== text);
  for (const { file } of fileChanges) console.log(`  file ${path.relative(process.cwd(), file)}`);

  const sample = dbChanges[0];
  if (sample) {
    const before = sharedKeysIn(sample.raw)[0];
    console.log(`\nПример: ${objectUrl(before)}\n      → ${objectUrl(`${KEY_PREFIX}/${before}`)}`);
  }
  console.log(`\nК изменению: строк БД ${dbChanges.length}, файлов ${fileChanges.length}`);
  if (missing.length) console.log(`⚠️  Без копии (ссылки не тронуты), сначала copy-referenced-s3-objects.mjs --apply:\n  ${missing.slice(0, 10).join("\n  ")}`);

  if (!APPLY) {
    console.log("\nЭто был dry run. Для записи: node scripts/rewrite-s3-urls-to-prefix.mjs --apply");
    return;
  }

  // 4. Backup, then write
  const outDir = path.join(process.cwd(), "scratch");
  fs.mkdirSync(outDir, { recursive: true });
  const backupFile = path.join(outDir, `s3-rewrite-${KEY_PREFIX}-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    db: dbChanges.map((c) => ({ table: c.column.table_name, column: c.column.column_name, pk: c.pk, pkValue: c.pkValue, old: c.raw })),
    files: fileChanges.map((c) => ({ file: path.relative(process.cwd(), c.file), old: c.text })),
  }, null, 2));
  console.log(`\nБэкап старых значений: ${path.relative(process.cwd(), backupFile)}`);

  let updated = 0, conflicts = 0;
  await db.query("BEGIN");
  try {
    for (const c of dbChanges) {
      const { column } = c;
      // The extra ::text check skips rows edited between planning and writing
      const res = await db.query(
        `UPDATE ${quote(column.table_name)} SET ${quote(column.column_name)} = $1::${castFor(column)}
         WHERE ${quote(c.pk)}::text = $2 AND ${quote(column.column_name)}::text = $3`,
        [serialize(c.next, column), c.pkValue, c.raw]
      );
      if (res.rowCount === 1) updated++;
      else conflicts++;
    }
    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
  console.log(`БД: обновлено ${updated}, пропущено (строка изменилась) ${conflicts}`);

  for (const { file, next } of fileChanges) fs.writeFileSync(file, next);
  console.log(`Файлов переписано: ${fileChanges.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end().catch(() => {}));
