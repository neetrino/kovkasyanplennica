'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';

export type InputVariant = 'default' | 'admin';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, className = '', onKeyDown, variant = 'default', ...props },
    ref
  ) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === '|' || e.keyCode === 220 || (e.shiftKey && e.key === '\\')) {
        return;
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const labelClass =
      variant === 'admin'
        ? 'block text-sm font-medium text-admin-flesh mb-1'
        : 'block text-sm font-medium text-gray-700 mb-1';

    const inputBase =
      variant === 'admin'
        ? 'w-full px-4 py-2 rounded-md border bg-admin-brand text-admin-flesh placeholder:text-admin-flesh-muted focus:outline-none focus:ring-2 focus:ring-admin-warm focus:border-transparent disabled:cursor-not-allowed disabled:opacity-60 border-white/20'
        : `w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
            error ? 'border-error focus:ring-error' : 'border-gray-300'
          }`;

    return (
      <div className="w-full">
        {label ? <label className={labelClass}>{label}</label> : null}
        <input
          ref={ref}
          className={`${inputBase} ${className}`}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {error ? <p className="mt-1 text-sm text-error">{error}</p> : null}
      </div>
    );
  }
);
