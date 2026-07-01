'use client';

import Link from 'next/link';
import type { ComponentProps, FocusEvent, MouseEvent } from 'react';
import { usePrefetchOnHover } from '@/lib/navigation/use-prefetch-on-hover';

type ProductCardLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch' | 'href'> & {
  href: string;
};

export function ProductCardLink({ href, onMouseEnter, onFocus, ...rest }: ProductCardLinkProps) {
  const prefetchOnHover = usePrefetchOnHover();

  const warmRoute = () => {
    prefetchOnHover(href);
  };

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(event: MouseEvent<HTMLAnchorElement>) => {
        warmRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        warmRoute();
        onFocus?.(event);
      }}
      {...rest}
    />
  );
}
