'use client';

import React, { HTMLAttributes, forwardRef, ReactElement } from 'react';

export type CardVariant = 'default' | 'admin';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** `admin` — project admin panel main-area cards (white surface, dark text). */
  variant?: CardVariant;
}

const variantBase: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  admin:
    'rounded-xl border border-gray-200/80 bg-white text-gray-900 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_10px_28px_-8px_rgba(47,63,61,0.11)]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(
    { className = '', children, variant = 'default', ...props },
    ref
  ): ReactElement {
    return (
      <div
        ref={ref}
        className={`${variantBase[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
