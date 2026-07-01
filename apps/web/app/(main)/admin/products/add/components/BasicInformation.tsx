'use client';

import type { ChangeEvent } from 'react';
import { Input } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';

interface BasicInformationProps {
  productType: 'simple' | 'variable';
  setProductType: (type: 'simple' | 'variable') => void;
  title: string;
  slug: string;
  subtitle: string;
  descriptionHtml: string;
  ingredients: string;
  longDescriptionHtml: string;
  onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubtitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onIngredientsChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onLongDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

export function BasicInformation({
  productType,
  setProductType,
  title,
  slug,
  subtitle,
  descriptionHtml,
  ingredients,
  longDescriptionHtml,
  onTitleChange,
  onSlugChange,
  onSubtitleChange,
  onDescriptionChange,
  onIngredientsChange,
  onLongDescriptionChange,
}: BasicInformationProps) {
  const { t } = useTranslation();

  const textareaClassName =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.products.add.basicInformation')}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.products.add.productType')} *
          </label>
          <p className="text-xs text-gray-500 mb-3">
            {t('admin.products.add.productTypeDescription')}
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productType"
                value="simple"
                checked={productType === 'simple'}
                onChange={(e) => setProductType(e.target.value as 'simple' | 'variable')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('admin.products.add.productTypeSimple')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productType"
                value="variable"
                checked={productType === 'variable'}
                onChange={(e) => setProductType(e.target.value as 'simple' | 'variable')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('admin.products.add.productTypeVariable')}</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.title')} *
          </label>
          <Input
            type="text"
            value={title}
            onChange={onTitleChange}
            required
            placeholder={t('admin.products.add.productTitlePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.slug')} *
          </label>
          <Input
            type="text"
            value={slug}
            onChange={onSlugChange}
            required
            placeholder={t('admin.products.add.productSlugPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.subtitle')}
          </label>
          <Input
            type="text"
            value={subtitle}
            onChange={onSubtitleChange}
            placeholder={t('admin.products.add.productSubtitlePlaceholder')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('admin.products.add.subtitleHint')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.shortDescription')}
          </label>
          <textarea
            className={textareaClassName}
            rows={3}
            value={descriptionHtml}
            onChange={onDescriptionChange}
            placeholder={t('admin.products.add.productShortDescriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.ingredients')}
          </label>
          <textarea
            className={textareaClassName}
            rows={3}
            value={ingredients}
            onChange={onIngredientsChange}
            placeholder={t('admin.products.add.productIngredientsPlaceholder')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('admin.products.add.ingredientsHint')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.longDescription')}
          </label>
          <textarea
            className={textareaClassName}
            rows={8}
            value={longDescriptionHtml}
            onChange={onLongDescriptionChange}
            placeholder={t('admin.products.add.productLongDescriptionPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}
