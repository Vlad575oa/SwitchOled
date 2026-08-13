import * as XLSX from "xlsx";

/** Читает первый лист книги (xlsx/xls) в массив строк-массивов ячеек. */
export function readWorkbookRows(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
}
