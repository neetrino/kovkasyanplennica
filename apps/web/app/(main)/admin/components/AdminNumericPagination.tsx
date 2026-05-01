'use client';

import type { ReactNode } from 'react';
import { Button } from '@shop/ui';
import {
  adminPaginationBarClass,
  adminPaginationMetaClass,
  adminPaginationNavButtonClass,
} from './dashboardUi';

/** Max count of consecutive page number buttons (sliding window; not “draw all pages”). */
const MAX_SLIDING_PAGE_BUTTONS = 10;

/**
 * 1-based page indices: at most {@link MAX_SLIDING_PAGE_BUTTONS} consecutive numbers
 * centered on `currentPage` (clamped), plus leading `1` / trailing last page with `…` when omitted.
 */
export function buildAdminPaginationPageItems(
  currentPage: number,
  totalPages: number
): Array<number | 'ellipsis'> {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= MAX_SLIDING_PAGE_BUTTONS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const clamped = Math.min(Math.max(currentPage, 1), totalPages);
  const span = MAX_SLIDING_PAGE_BUTTONS - 1;
  let windowStart = clamped - Math.floor(span / 2);
  let windowEnd = windowStart + span;

  if (windowStart < 1) {
    windowStart = 1;
    windowEnd = MAX_SLIDING_PAGE_BUTTONS;
  }
  if (windowEnd > totalPages) {
    windowEnd = totalPages;
    windowStart = windowEnd - MAX_SLIDING_PAGE_BUTTONS + 1;
  }

  const out: Array<number | 'ellipsis'> = [];

  if (windowStart > 1) {
    out.push(1);
    if (windowStart > 2) {
      out.push('ellipsis');
    }
  }

  for (let p = windowStart; p <= windowEnd; p += 1) {
    out.push(p);
  }

  if (windowEnd < totalPages) {
    if (windowEnd < totalPages - 1) {
      out.push('ellipsis');
    }
    out.push(totalPages);
  }

  return out;
}

const pageNumberActiveClass =
  'inline-flex min-h-8 min-w-[2.25rem] cursor-default items-center justify-center rounded-md border border-admin-brand bg-admin-brand px-2 text-sm font-medium text-admin-flesh';

export interface AdminPaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
}

/** Prev + numbered pages + next (no summary row). */
export function AdminPaginationControls({
  page,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
}: AdminPaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = buildAdminPaginationPageItems(page, totalPages);

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5" role="navigation" aria-label="Pagination">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={adminPaginationNavButtonClass}
      >
        {previousLabel}
      </Button>

      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="select-none px-1 text-sm text-admin-muted"
            aria-hidden
          >
            …
          </span>
        ) : item === page ? (
          <span key={item} className={pageNumberActiveClass} aria-current="page">
            {item}
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(item)}
            className={`min-w-[2.25rem] ${adminPaginationNavButtonClass}`}
          >
            {item}
          </Button>
        )
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={adminPaginationNavButtonClass}
      >
        {nextLabel}
      </Button>
    </div>
  );
}

export interface AdminNumericPaginationProps extends AdminPaginationControlsProps {
  summary: ReactNode;
  /** Appended to the outer bar (e.g. `border-t border-admin-brand-2/18 pt-4`). */
  wrapperClassName?: string;
}

/** Summary row + {@link AdminPaginationControls}. */
export function AdminNumericPagination({
  summary,
  wrapperClassName = '',
  page,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
}: AdminNumericPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`${adminPaginationBarClass} ${wrapperClassName}`.trim()}>
      <div className={adminPaginationMetaClass}>{summary}</div>
      <AdminPaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
      />
    </div>
  );
}
