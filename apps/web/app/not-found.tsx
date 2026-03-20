import { t } from '../lib/i18n';

/**
 * Custom 404 Not Found Page
 * 
 * This page is displayed when a route is not found.
 * Server-safe 404 page without client hooks.
 */
export default function NotFound() {
  const lang = 'ru';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t(lang, 'common.notFound.title')}</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {t(lang, 'common.notFound.description')}
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            {t(lang, 'common.notFound.goHome')}
          </a>
          <a
            href="/products"
            className="px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t(lang, 'common.buttons.browseProducts')}
          </a>
        </div>
      </div>
    </div>
  );
}
