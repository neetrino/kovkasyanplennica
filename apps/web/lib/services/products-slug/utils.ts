import { translations } from "../../translations";

/**
 * Get "Out of Stock" translation for a given language
 */
export function getOutOfStockLabel(lang: string = "ru"): string {
  const langKey = lang as keyof typeof translations;
  const translation = translations[langKey] || translations.ru;
  return translation.stock.outOfStock;
}








