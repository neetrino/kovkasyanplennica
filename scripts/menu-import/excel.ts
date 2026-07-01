import path from "node:path";
import XLSX from "xlsx";
import { buildDescriptionHtml, normalizeText, parsePrice } from "./normalize";

export type MenuExcelRow = {
  id: string;
  category: string;
  title: string;
  composition: string;
  weight: string;
  price: number;
  priceRaw: string;
  descriptionHtml?: string;
};

const COLUMN_MAP = {
  id: "ID",
  category: "Категория",
  title: "Название",
  composition: "Состав",
  weight: "Вес",
  price: "Цена RUB",
} as const;

export function readMenuExcel(excelPath: string): MenuExcelRow[] {
  const workbook = XLSX.readFile(excelPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error(`No sheets found in ${excelPath}`);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  const parsed: MenuExcelRow[] = [];
  for (const row of rows) {
    const category = normalizeText(String(row[COLUMN_MAP.category] ?? ""));
    const title = normalizeText(String(row[COLUMN_MAP.title] ?? "").replace(/\n/g, " "));
    if (!category || !title) continue;

    const composition = normalizeText(String(row[COLUMN_MAP.composition] ?? "").replace(/\n/g, " "));
    const weight = normalizeText(String(row[COLUMN_MAP.weight] ?? ""));
    const priceRaw = normalizeText(String(row[COLUMN_MAP.price] ?? ""));

    parsed.push({
      id: normalizeText(String(row[COLUMN_MAP.id] ?? "")),
      category,
      title,
      composition,
      weight,
      priceRaw,
      price: parsePrice(priceRaw),
      descriptionHtml: buildDescriptionHtml(composition, weight),
    });
  }

  return parsed;
}

export function defaultExcelPath(rootDir: string): string {
  return path.join(rootDir, "kovkaskaya_plenica_menu (2).xlsm");
}
