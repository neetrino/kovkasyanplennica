/**
 * Shared layout / surface classes for `/admin` dashboard (Վահանակ).
 * Uses `admin.*` tokens from tailwind.config.ts.
 */

export const dashboardMainClass =
  'mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-8 sm:space-y-7 sm:px-6 lg:space-y-8 lg:px-10';

export const dashboardCardPadding = 'p-5 sm:p-6';

export const dashboardSectionHeaderRow =
  'mb-4 flex items-baseline justify-between gap-3 border-b border-admin-brand-2/18 pb-3';

export const dashboardSectionTitle = 'text-lg font-semibold tracking-tight text-admin-brand';

export const dashboardGhostLink =
  'shrink-0 rounded-sm text-sm font-medium text-admin-brand/55 transition-colors hover:text-admin-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/25 focus-visible:ring-offset-2';

export const dashboardInsetRow =
  'rounded-lg border border-admin-brand-2/18 bg-white p-4 transition-colors hover:border-admin-brand-2/35 hover:bg-admin-surface/80';

/** Dense rows (e.g. product list) */
export const dashboardInsetRowCompact =
  'rounded-lg border border-admin-brand-2/18 bg-white p-3 transition-colors hover:border-admin-brand-2/35 hover:bg-admin-surface/80';

export const statCardInteractive =
  'cursor-pointer transition-[box-shadow,border-color] duration-300 ease-out hover:border-admin-brand-2/45 hover:shadow-[0_14px_44px_-12px_rgba(47,63,61,0.22),0_4px_18px_-4px_rgba(61,80,78,0.16)]';

export const metricLabelClass = 'text-sm font-medium text-admin-brand/60';

export const metricValueClass = 'mt-2 text-3xl font-bold tracking-tight text-admin-brand';

/** Primary line inside list rows (titles, amounts) */
export const dashboardRowPrimary = 'text-sm font-semibold text-admin-brand';

export const dashboardRowPrimaryMedium = 'text-sm font-medium text-admin-brand';

/** Secondary line (email, SKU) */
export const dashboardRowSecondary = 'text-xs text-admin-brand/55';

/** Tertiary / meta (timestamps, counts) */
export const dashboardRowMeta = 'text-xs text-admin-muted';

/** Empty-state and helper copy */
export const dashboardEmptyText = 'text-sm text-admin-brand/50';

/** Subsection label (e.g. column headers inside a card) */
export const dashboardSubsectionLabel =
  'mb-3 text-sm font-semibold uppercase tracking-wide text-admin-brand/50';

/** Card title underline block (single full-width title) */
export const dashboardTitleBlock = 'mb-6 border-b border-admin-brand-2/18 pb-4';

/** Quick action icon circle — matches metric icons */
export const dashboardQuickIconWrap =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-admin-surface ring-1 ring-inset ring-admin-brand/[0.08]';

/** Outline quick-action tiles (`Button` outline variant defaults to gray border — use `!` so admin tint wins) */
export const dashboardQuickActionButton =
  'h-auto justify-start !border-admin-brand-2/25 py-4 !text-admin-brand transition-colors hover:!border-admin-brand-2/45 hover:!bg-admin-surface/65';

/** Rank / index chip in lists */
export const dashboardRankChip =
  'flex h-10 w-10 items-center justify-center rounded-lg bg-admin-surface text-xs font-bold text-admin-brand/70 ring-1 ring-inset ring-admin-brand/[0.06]';

/** Payment status chips (admin-tinted, not neon) */
export const dashboardBadgePaid =
  'rounded-full bg-admin-surface px-2 py-0.5 text-xs font-medium text-admin-brand ring-1 ring-inset ring-admin-brand/12';

export const dashboardBadgePending =
  'rounded-full bg-admin-warm/60 px-2 py-0.5 text-xs font-medium text-admin-brand';

export const dashboardBadgeNeutral =
  'rounded-full bg-admin-surface px-2 py-0.5 text-xs font-medium text-admin-muted ring-1 ring-inset ring-admin-brand-2/14';

export const dashboardQuickTitle = 'text-sm font-medium text-admin-brand';

export const dashboardQuickSubtitle = 'text-xs text-admin-muted';

export const iconCircleClass =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-admin-surface ring-1 ring-inset ring-admin-brand/[0.06]';

// —— Shared admin light UI (orders, filters, modals, …) ——

export const adminFormControlClass =
  'rounded-md border border-admin-brand-2/25 bg-white px-3 py-2 text-sm text-admin-brand placeholder:text-admin-muted focus:border-admin-brand-2/45 focus:outline-none focus:ring-2 focus:ring-admin-brand/20';

export const adminFilterLabelClass = 'mb-1.5 block text-sm font-medium text-admin-brand/65';

/** Full-width primary CTA on admin light pages (e.g. «Ավելացնել ապրանք») */
export const adminPrimaryCtaClass =
  'flex w-full items-center justify-center gap-2 rounded-lg border border-admin-brand-2/30 bg-admin-brand px-4 py-3 text-sm font-medium text-admin-flesh transition-colors hover:bg-admin-brand-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/30 focus-visible:ring-offset-2';

/** Solid save CTA on light admin cards (overrides default gray `Button` primary) */
export const adminSolidButtonClass =
  '!border-admin-brand-2/35 !bg-admin-brand !text-admin-flesh hover:!brightness-[1.04] focus-visible:!ring-2 focus-visible:!ring-admin-brand/35 focus-visible:!ring-offset-2';

export const adminSectionSubtitleClass = 'text-sm text-admin-brand/60';

/** Small icon disc in section headers (quick settings, etc.) */
export const adminSectionIconWrapClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-admin-surface ring-1 ring-inset ring-admin-brand/[0.08]';

export const adminTableSortButtonClass =
  'inline-flex items-center gap-1 text-admin-brand/50 transition-colors hover:text-admin-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/20 focus-visible:ring-offset-1 rounded-sm';

export const adminIconGhostButtonClass =
  'rounded-md p-2 !text-admin-brand/70 transition-colors hover:!bg-admin-surface hover:!text-admin-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/25';

export const adminIconDangerGhostButtonClass =
  'rounded-md p-2 !text-red-800/95 transition-colors hover:!bg-red-50 hover:!text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50';

export const adminPublishedToggleOnClass =
  'relative inline-flex h-5 w-9 items-center rounded-full bg-admin-brand transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/35 focus-visible:ring-offset-2';

export const adminPublishedToggleOffClass =
  'relative inline-flex h-5 w-9 items-center rounded-full bg-admin-brand-2/35 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/25 focus-visible:ring-offset-2';

/** Compact `<select>` on tinted status background (table cells) */
export const adminInlineSelectClass =
  'max-w-[10.5rem] cursor-pointer rounded-md border-0 py-1.5 pl-2 pr-8 text-xs font-medium shadow-none focus:outline-none focus:ring-2 focus:ring-admin-brand/25';

export const adminAlertSuccessClass =
  'rounded-md border border-admin-brand-2/20 bg-admin-surface px-4 py-2 text-sm text-admin-brand';

export const adminAlertErrorClass =
  'rounded-md border border-red-200/90 bg-red-50/90 px-4 py-2 text-sm text-red-900';

export const adminTableWrapClass = 'min-w-full divide-y divide-admin-brand-2/15';

export const adminTableHeadRowClass = 'bg-admin-surface';

export const adminTableHeadCellClass =
  'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-admin-brand/50';

export const adminTableSortableThClass = `${adminTableHeadCellClass} cursor-pointer select-none transition-colors hover:bg-admin-surface/90`;

export const adminTableBodyClass = 'divide-y divide-admin-brand-2/12 bg-white';

export const adminTableRowHoverClass = 'transition-colors hover:bg-admin-surface/50';

export const adminSortIconActiveClass = 'text-admin-brand';

export const adminSortIconIdleClass = 'text-admin-muted';

export const adminDetailSectionTitleClass = 'mb-2 text-sm font-semibold text-admin-brand';

export const adminDetailBodyClass = 'space-y-1 text-sm text-admin-brand/80';

/** Single summary row (flex) — avoid `space-y` on flex rows */
export const adminDetailRowClass = 'flex justify-between text-sm text-admin-brand/80';

export const adminDetailMutedClass = 'text-sm text-admin-brand/50';

export const adminModalBackdropClass =
  'fixed inset-0 z-app-modal flex items-center justify-center bg-admin-brand/45 p-4 backdrop-blur-[2px]';

/** Tall / scrollable modals (e.g. spin wheel forms) */
export const adminModalBackdropAlignStartClass =
  'fixed inset-0 z-app-modal flex items-start justify-center overflow-y-auto bg-admin-brand/45 px-4 pb-8 pt-16 backdrop-blur-[2px]';

export const adminModalPanelClass =
  'max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-admin-brand-2/20 bg-white shadow-[0_24px_60px_-16px_rgba(47,63,61,0.28)]';

export const adminModalHeaderClass =
  'sticky top-0 z-10 flex items-center justify-between border-b border-admin-brand-2/18 bg-white px-6 py-4';

export const adminModalTitleClass = 'text-xl font-semibold tracking-tight text-admin-brand';

export const adminGhostIconButtonClass =
  'rounded-md text-admin-muted transition-colors hover:bg-admin-surface hover:text-admin-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/25';

export const adminPaginationBarClass = 'mt-6 flex flex-wrap items-center justify-between gap-3';

export const adminPaginationMetaClass = 'text-sm text-admin-brand/65';

export const adminPaginationNavButtonClass =
  '!border-admin-brand-2/25 !text-admin-brand hover:!bg-admin-surface/80 disabled:!opacity-40';

export const adminBulkDangerButtonClass =
  '!border-red-300/90 !text-red-900 hover:!border-red-400 hover:!bg-red-50/90';
