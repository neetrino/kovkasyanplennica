/**
 * i18n helper functions
 * Server-side translation functions (Safe for build/prerendering)
 */

import { type LanguageCode } from './language';

import ruCommon from '../locales/ru/common.json';
import ruHome from '../locales/ru/home.json';
import ruProduct from '../locales/ru/product.json';
import ruProducts from '../locales/ru/products.json';
import ruAttributes from '../locales/ru/attributes.json';
import ruDelivery from '../locales/ru/delivery.json';
import ruAbout from '../locales/ru/about.json';
import ruContact from '../locales/ru/contact.json';
import ruFaq from '../locales/ru/faq.json';
import ruLogin from '../locales/ru/login.json';
import ruCookies from '../locales/ru/cookies.json';
import ruDeliveryTerms from '../locales/ru/delivery-terms.json';
import ruTerms from '../locales/ru/terms.json';
import ruPrivacy from '../locales/ru/privacy.json';
import ruSupport from '../locales/ru/support.json';
import ruStores from '../locales/ru/stores.json';
import ruReturns from '../locales/ru/returns.json';
import ruRefundPolicy from '../locales/ru/refund-policy.json';
import ruProfile from '../locales/ru/profile.json';
import ruCheckout from '../locales/ru/checkout.json';
import ruRegister from '../locales/ru/register.json';
import ruCategories from '../locales/ru/categories.json';
import ruOrders from '../locales/ru/orders.json';
import ruAdmin from '../locales/ru/admin.json';
import ruDesktops from '../locales/ru/desktops.json';
import ruVacancies from '../locales/ru/vacancies.json';

export type Namespace = 'common' | 'home' | 'product' | 'products' | 'attributes' | 'delivery' | 'about' | 'contact' | 'faq' | 'login' | 'cookies' | 'delivery-terms' | 'terms' | 'privacy' | 'support' | 'stores' | 'returns' | 'refund-policy' | 'profile' | 'checkout' | 'register' | 'categories' | 'orders' | 'admin' | 'desktops' | 'vacancies';
export type ProductField = 'title' | 'shortDescription' | 'longDescription';

type TranslationNamespaces = Record<Namespace, Record<string, unknown>>;

const translations: Partial<Record<LanguageCode, TranslationNamespaces>> = {
  ru: {
    common: ruCommon as Record<string, unknown>,
    home: ruHome as Record<string, unknown>,
    product: ruProduct as Record<string, unknown>,
    products: ruProducts as Record<string, unknown>,
    attributes: ruAttributes as Record<string, unknown>,
    delivery: ruDelivery as Record<string, unknown>,
    about: ruAbout as Record<string, unknown>,
    contact: ruContact as Record<string, unknown>,
    faq: ruFaq as Record<string, unknown>,
    login: ruLogin as Record<string, unknown>,
    cookies: ruCookies as Record<string, unknown>,
    'delivery-terms': ruDeliveryTerms as Record<string, unknown>,
    terms: ruTerms as Record<string, unknown>,
    privacy: ruPrivacy as Record<string, unknown>,
    support: ruSupport as Record<string, unknown>,
    stores: ruStores as Record<string, unknown>,
    returns: ruReturns as Record<string, unknown>,
    'refund-policy': ruRefundPolicy as Record<string, unknown>,
    profile: ruProfile as Record<string, unknown>,
    checkout: ruCheckout as Record<string, unknown>,
    register: ruRegister as Record<string, unknown>,
    categories: ruCategories as Record<string, unknown>,
    orders: ruOrders as Record<string, unknown>,
    admin: ruAdmin as Record<string, unknown>,
    desktops: ruDesktops as Record<string, unknown>,
    vacancies: ruVacancies as Record<string, unknown>,
  },
};

const translationCache = new Map<string, string>();

function getSafeLang(lang: LanguageCode | undefined): LanguageCode {
  if (lang) return lang;

  if (typeof window === 'undefined') return 'ru';

  try {
    const { getStoredLanguage } = require('./language');
    return getStoredLanguage() || 'ru';
  } catch {
    return 'ru';
  }
}

function getNestedValue(obj: unknown, keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return current;
}

export function loadTranslation(lang: LanguageCode, namespace: Namespace): Record<string, unknown> | null {
  const loaded = translations[lang]?.[namespace] ?? translations.ru?.[namespace];
  return loaded ?? null;
}

export function t(lang: LanguageCode | undefined, path: string): string {
  if (!path) return '';
  const currentLang = getSafeLang(lang);

  const parts = path.split('.');
  if (parts.length < 2) return path;

  const namespace = parts[0] as Namespace;
  const keys = parts.slice(1);

  const cacheKey = `${currentLang}:${path}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  let translationObj = loadTranslation(currentLang, namespace);
  let value = getNestedValue(translationObj, keys);

  if (value === null && currentLang !== 'ru') {
    value = getNestedValue(loadTranslation('ru', namespace), keys);
  }

  const result = typeof value === 'string' ? value : path;
  if (translationCache.size < 1000) translationCache.set(cacheKey, result);

  return result;
}

export function getProductText(lang: LanguageCode | undefined, productId: string, field: ProductField): string {
  const currentLang = getSafeLang(lang);
  try {
    const products = loadTranslation(currentLang, 'products');
    const product = products?.[productId] as Record<string, string> | undefined;
    if (product?.[field]) return product[field];
    const ruProducts = loadTranslation('ru', 'products');
    return (ruProducts?.[productId] as Record<string, string> | undefined)?.[field] || '';
  } catch {
    return '';
  }
}

export function getAttributeLabel(lang: LanguageCode | undefined, type: string, value: string): string {
  const currentLang = getSafeLang(lang);
  if (!value) return '';
  try {
    const attrs = loadTranslation(currentLang, 'attributes');
    const typeMap = attrs?.[type] as Record<string, string> | undefined;
    const label = typeMap?.[value.toLowerCase().trim()];
    if (label) return label;
    const ruAttrs = loadTranslation('ru', 'attributes');
    const ruTypeMap = ruAttrs?.[type] as Record<string, string> | undefined;
    return ruTypeMap?.[value.toLowerCase().trim()] || value;
  } catch {
    return value;
  }
}

export function clearTranslationCache(): void {
  translationCache.clear();
}

export function getAvailableLanguages(): LanguageCode[] {
  return ['ru'];
}
