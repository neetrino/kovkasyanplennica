// Translation utilities
import { getStoredLanguage, type LanguageCode } from './language';

export const translations = {
  ru: {
    stock: {
      inStock: 'В наличии',
      outOfStock: 'Нет в наличии',
    },
    cart: {
      title: 'Корзина покупок',
      empty: 'Ваша корзина пуста',
      orderSummary: 'Сводка заказа',
      subtotal: 'Промежуточный итог',
      shipping: 'Доставка',
      tax: 'Налог',
      total: 'Итого',
      free: 'Бесплатно',
      proceedToCheckout: 'Перейти к оплате',
      remove: 'Удалить',
      items: 'товаров',
      item: 'товар',
    },
    wishlist: {
      title: 'Мой список желаний',
      empty: 'Ваш список желаний пуст',
      emptyDescription: 'Начните добавлять товары в список желаний, чтобы сохранить их на потом.',
      browseProducts: 'Просмотреть товары',
      remove: 'Удалить',
      items: 'товаров',
      item: 'товар',
      totalCount: 'Всего товаров в списке желаний',
    },
    compare: {
      title: 'Сравнить товары',
      empty: 'Нет товаров для сравнения',
      emptyDescription: 'Добавьте до 4 товаров, чтобы сравнить их характеристики и цены.',
      browseProducts: 'Просмотреть товары',
      remove: 'Удалить',
      products: 'товаров',
      product: 'товар',
    },
    product: {
      addToCart: 'Добавить в корзину',
      addToWishlist: 'Добавить в список желаний',
      viewProduct: 'Просмотреть товар',
      viewDetails: 'Просмотреть детали',
      productInformation: 'Информация о товаре',
      browseProducts: 'Просмотреть товары',
    },
    breadcrumb: {
      home: 'Главная',
      products: 'Товары',
      categories: 'Категории',
      cart: 'Корзина',
      wishlist: 'Список желаний',
      compare: 'Сравнить',
      checkout: 'Оформление',
      profile: 'Профиль',
      orders: 'Заказы',
      login: 'Вход',
      register: 'Регистрация',
      about: 'О нас',
      contact: 'Контакты',
      admin: 'Админ',
      faq: 'FAQ',
      shipping: 'Доставка',
      returns: 'Возврат',
      support: 'Поддержка',
      privacy: 'Конфиденциальность',
      terms: 'Условия',
      cookies: 'Cookie',
      delivery: 'Доставка',
      stores: 'Магазины',
    },
    reviews: {
      title: 'Отзывы',
      writeReview: 'Написать отзыв',
      rating: 'Оценка',
      comment: 'Ваш отзыв',
      commentPlaceholder: 'Поделитесь своими мыслями об этом товаре...',
      submit: 'Отправить отзыв',
      submitting: 'Отправка...',
      cancel: 'Отмена',
      loginRequired: 'Пожалуйста, войдите, чтобы написать отзыв',
      ratingRequired: 'Пожалуйста, выберите оценку',
      commentRequired: 'Пожалуйста, напишите отзыв',
      submitError: 'Не удалось отправить отзыв',
      noReviews: 'Отзывов пока нет. Будьте первым, кто оставит отзыв!',
      review: 'отзыв',
      reviews: 'отзывов',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.ru;

function getNestedString(obj: unknown, keys: string[]): string | null {
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

export function getTranslation(key: string, language?: LanguageCode): string {
  const lang = language || getStoredLanguage();
  const keys = key.split('.');
  const primary = translations[lang];
  let result = primary ? getNestedString(primary, keys) : null;
  if (result === null) {
    result = getNestedString(translations.ru, keys);
  }
  return result ?? key;
}

export function useTranslation() {
  return {
    t: (key: string) => getTranslation(key),
  };
}
