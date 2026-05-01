'use client';

import React, { ButtonHTMLAttributes, forwardRef, ReactElement } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'adminPrimary'
  | 'adminOutline'
  | 'adminGhost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', className = '', children, ...props },
    ref
  ): ReactElement {
    const baseStyles =
      'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 focus:ring-offset-2',
      secondary:
        'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 focus:ring-offset-2',
      outline:
        'bg-transparent text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 focus:ring-offset-2',
      ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-500 focus:ring-offset-2',
      adminPrimary:
        'bg-admin-warm text-admin-brand hover:brightness-105 focus:ring-admin-warm focus:ring-offset-2 focus:ring-offset-admin-brand-2',
      adminOutline:
        'border border-white/30 bg-transparent text-admin-flesh hover:bg-white/10 focus:ring-admin-warm focus:ring-offset-2 focus:ring-offset-admin-brand-2',
      adminGhost:
        'bg-transparent text-admin-flesh hover:bg-white/10 focus:ring-admin-warm focus:ring-offset-2 focus:ring-offset-admin-brand-2',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
