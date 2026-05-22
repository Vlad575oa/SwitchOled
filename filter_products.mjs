import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const inputPath = '/Users/vladislavolejnik/Downloads/products-export-2026-05-21.xlsx';
const outputDir = '/Users/vladislavolejnik/Desktop/Nintendo/outputs/filtered';
const outputPath = path.join(outputDir, 'products-export-2026-05-21-filtered.xlsx');

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItemAt(0);
const used = sheet.usedRange;
const vals = used.values;

if (!vals || vals.length < 2) {
  throw new Error('No data rows found');
}

const headers = vals[0].map(v => String(v ?? '').trim().toLowerCase());

const inStockIdx = headers.findIndex(h =>
  h.includes('в наличии') || h.includes('налич') || h === 'stock' || h.includes('in stock')
);
const hiddenIdx = headers.findIndex(h =>
  h.includes('скрыт') || h.includes('hidden') || h.includes('видимость')
);

if (inStockIdx === -1 || hiddenIdx === -1) {
  throw new Error(`Could not find needed columns. Headers: ${headers.join(' | ')}`);
}

const keep = [vals[0]];
for (let r = 1; r < vals.length; r++) {
  const row = vals[r];
  const stockRaw = row[inStockIdx];
  const hiddenRaw = row[hiddenIdx];

  const stockStr = String(stockRaw ?? '').trim().toLowerCase();
  const hiddenStr = String(hiddenRaw ?? '').trim().toLowerCase();

  const inStock = (
    stockRaw === true ||
    (typeof stockRaw === 'number' && stockRaw > 0) ||
    stockStr === 'да' || stockStr === 'yes' || stockStr === 'true' || stockStr === '1' || stockStr === 'есть'
  );

  const isHidden = (
    hiddenRaw === true ||
    hiddenRaw === 1 ||
    hiddenStr === 'да' || hiddenStr === 'yes' || hiddenStr === 'true' || hiddenStr === '1' || hiddenStr === 'скрыт'
  );

  if (inStock && !isHidden) keep.push(row);
}

used.clear();
const outRange = sheet.getRangeByIndexes(0, 0, keep.length, vals[0].length);
outRange.values = keep;

await fs.mkdir(outputDir, { recursive: true });
const out = await SpreadsheetFile.exportXlsx(workbook);
await out.save(outputPath);

console.log(JSON.stringify({ outputPath, totalShown: keep.length - 1, headers }, null, 2));
