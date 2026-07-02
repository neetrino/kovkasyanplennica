export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeKey(value: string): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ё/g, "е")
    .replace(/[«»"'`]/g, "")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function stripNamePrefixes(value: string): string {
  return value
    .replace(/^(салат|пицца|люля-кебаб|кебаб|крем-суп|суп|шашлык)\s+/i, "")
    .trim();
}

export function slugify(input: string): string {
  const cyrillicMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  const transliterated = input
    .toLowerCase()
    .split("")
    .map((char) => cyrillicMap[char] ?? char)
    .join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80) || "item";
}

export function parsePrice(raw: string): number {
  const digits = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const price = Number.parseFloat(digits);
  return Number.isFinite(price) ? price : 0;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildDescriptionHtml(composition: string, weight: string): string | undefined {
  const parts = [composition.trim(), weight.trim()].filter(Boolean);
  if (parts.length === 0) return undefined;
  return `<p>${parts.map((part) => escapeHtml(part)).join("<br/>")}</p>`;
}
