/**
 * i18n helper functions 
 * Server-side translation functions (Safe for build/prerendering)
 */

import { type LanguageCode } from './language';

// Մենք այլևս չենք անում սովորական import getStoredLanguage-ի համար
// import { getStoredLanguage } from './language'; ❌ - Սա հանում ենք

// Pre-load translations (Imports remain the same)
import enCommon from '../locales/en/common.json';
import enHome from '../locales/en/home.json';
import enProduct from '../locales/en/product.json';
import enProducts from '../locales/en/products.json';
import enAttributes from '../locales/en/attributes.json';
import enDelivery from '../locales/en/delivery.json';
import enAbout from '../locales/en/about.json';
import enContact from '../locales/en/contact.json';
import enFaq from '../locales/en/faq.json';
import enLogin from '../locales/en/login.json';
import enCookies from '../locales/en/cookies.json';
import enDeliveryTerms from '../locales/en/delivery-terms.json';
import enTerms from '../locales/en/terms.json';
import enPrivacy from '../locales/en/privacy.json';
import enSupport from '../locales/en/support.json';
import enStores from '../locales/en/stores.json';
import enReturns from '../locales/en/returns.json';
import enRefundPolicy from '../locales/en/refund-policy.json';
import enProfile from '../locales/en/profile.json';
import enCheckout from '../locales/en/checkout.json';
import enRegister from '../locales/en/register.json';
import enCategories from '../locales/en/categories.json';
import enOrders from '../locales/en/orders.json';
import enAdmin from '../locales/en/admin.json';

import hyCommon from '../locales/hy/common.json';
import hyHome from '../locales/hy/home.json';
import hyProduct from '../locales/hy/product.json';
import hyProducts from '../locales/hy/products.json';
import hyAttributes from '../locales/hy/attributes.json';
import hyDelivery from '../locales/hy/delivery.json';
import hyAbout from '../locales/hy/about.json';
import hyContact from '../locales/hy/contact.json';
import hyFaq from '../locales/hy/faq.json';
import hyLogin from '../locales/hy/login.json';
import hyCookies from '../locales/hy/cookies.json';
import hyDeliveryTerms from '../locales/hy/delivery-terms.json';
import hyTerms from '../locales/hy/terms.json';
import hyPrivacy from '../locales/hy/privacy.json';
import hySupport from '../locales/hy/support.json';
import hyStores from '../locales/hy/stores.json';
import hyReturns from '../locales/hy/returns.json';
import hyRefundPolicy from '../locales/hy/refund-policy.json';
import hyProfile from '../locales/hy/profile.json';
import hyCheckout from '../locales/hy/checkout.json';
import hyRegister from '../locales/hy/register.json';
import hyCategories from '../locales/hy/categories.json';
import hyOrders from '../locales/hy/orders.json';
import hyAdmin from '../locales/hy/admin.json';

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

export type Namespace = 'common' | 'home' | 'product' | 'products' | 'attributes' | 'delivery' | 'about' | 'contact' | 'faq' | 'login' | 'cookies' | 'delivery-terms' | 'terms' | 'privacy' | 'support' | 'stores' | 'returns' | 'refund-policy' | 'profile' | 'checkout' | 'register' | 'categories' | 'orders' | 'admin';
export type ProductField = 'title' | 'shortDescription' | 'longDescription';

const translations: Partial<Record<LanguageCode, Record<Namespace, any>>> = {
  en: { common: enCommon, home: enHome, product: enProduct, products: enProducts, attributes: enAttributes, delivery: enDelivery, about: enAbout, contact: enContact, faq: enFaq, login: enLogin, cookies: enCookies, 'delivery-terms': enDeliveryTerms, terms: enTerms, privacy: enPrivacy, support: enSupport, stores: enStores, returns: enReturns, 'refund-policy': enRefundPolicy, profile: enProfile, checkout: enCheckout, register: enRegister, categories: enCategories, orders: enOrders, admin: enAdmin },
  hy: { common: hyCommon, home: hyHome, product: hyProduct, products: hyProducts, attributes: hyAttributes, delivery: hyDelivery, about: hyAbout, contact: hyContact, faq: hyFaq, login: hyLogin, cookies: hyCookies, 'delivery-terms': hyDeliveryTerms, terms: hyTerms, privacy: hyPrivacy, support: hySupport, stores: hyStores, returns: hyReturns, 'refund-policy': hyRefundPolicy, profile: hyProfile, checkout: hyCheckout, register: hyRegister, categories: hyCategories, orders: hyOrders, admin: hyAdmin },
  ru: { common: ruCommon, home: ruHome, product: ruProduct, products: ruProducts, attributes: ruAttributes, delivery: ruDelivery, about: ruAbout, contact: ruContact, faq: ruFaq, login: ruLogin, cookies: ruCookies, 'delivery-terms': ruDeliveryTerms, terms: ruTerms, privacy: ruPrivacy, support: ruSupport, stores: ruStores, returns: ruReturns, 'refund-policy': ruRefundPolicy, profile: ruProfile, checkout: ruCheckout, register: ruRegister, categories: ruCategories, orders: ruOrders, admin: ruAdmin },
};

const translationCache = new Map<string, string>();

/**
 * ՎԵՐՋՆԱԿԱՆ ԱՆՎՏԱՆԳ ՖՈՒՆԿՑԻԱ
 */
function getSafeLang(lang: LanguageCode | undefined): LanguageCode {
  if (lang) return lang;
  
  // Եթե մենք build-ի մեջ ենք, երբեք մի փորձիր լեզու ստանալ
  if (typeof window === 'undefined') return 'ru';
  
  try {
    // Միայն runtime-ի ժամանակ ենք փորձում կանչել getStoredLanguage
    // Սա թույլ չի տա build worker-ին տեսնել useContext-ը
    const { getStoredLanguage } = require('./language');
    return getStoredLanguage() || 'ru';
  } catch (e) {
    return 'ru';
  }
}

function getNestedValue(obj: any, keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  return current;
}

export function loadTranslation(lang: LanguageCode, namespace: Namespace): any {
  return translations[lang]?.[namespace] || translations['ru']?.[namespace] || null;
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
    const product = products?.[productId];
    if (product?.[field]) return product[field];
    return loadTranslation('ru', 'products')?.[productId]?.[field] || '';
  } catch { return ''; }
}

export function getAttributeLabel(lang: LanguageCode | undefined, type: string, value: string): string {
  const currentLang = getSafeLang(lang);
  if (!value) return '';
  try {
    const attrs = loadTranslation(currentLang, 'attributes');
    const label = attrs?.[type]?.[value.toLowerCase().trim()];
    if (label) return label;
    return loadTranslation('ru', 'attributes')?.[type]?.[value.toLowerCase().trim()] || value;
  } catch { return value; }
}

export function clearTranslationCache(): void { translationCache.clear(); }
export function getAvailableLanguages(): LanguageCode[] { return ['en', 'hy', 'ru']; }