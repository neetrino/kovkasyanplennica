'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryEdgeScrollButtonProps {
  direction: 'left' | 'right';
  canScroll: boolean;
  onPress: () => void;
  label: string;
}

/**
 * Chevron for category row — inline (not overlay) so the scroll strip keeps full touch target.
 */
export function CategoryEdgeScrollButton({
  direction,
  canScroll,
  onPress,
  label,
}: CategoryEdgeScrollButtonProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (canScroll) onPress();
      }}
      disabled={!canScroll}
      className={`shrink-0 flex w-11 h-11 sm:w-12 sm:h-12 items-center justify-center rounded-md transition-all ${
        canScroll
          ? 'text-white hover:bg-white/10 cursor-pointer'
          : 'text-gray-500 cursor-not-allowed opacity-40'
      }`}
      aria-label={label}
    >
      <Icon className="w-7 h-7" aria-hidden />
    </button>
  );
}
