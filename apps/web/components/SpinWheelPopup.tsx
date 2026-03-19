'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth/AuthContext';
import { apiClient } from '../lib/api-client';
import { useTranslation } from '../lib/i18n-client';

interface SpinWheelPrize {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
  products?: Array<{
    productId: string;
    productTitle: string;
    productSlug: string;
    productImageUrl: string | null;
    imageUrl?: string | null;
    image?: string | null;
    url?: string | null;
  }>;
  startDate: string;
  endDate: string;
  audience: 'all' | 'selected';
  userIds: string[];
  maxSpinsPerUser: number | null;
  weight: number;
}

interface ActivePrizesResponse {
  data: SpinWheelPrize[];
  meta: {
    hasSpun: boolean;
    totalSpins: number;
    remainingSpins: number;
    maxSpinsPerUser: number;
  };
}

interface SpinResponse {
  success: boolean;
  data: {
    prize: SpinWheelPrize;
  };
}

/** Slot count; prizes are placed on a circle like clock numbers. */
const WHEEL_SLOT_COUNT_CONST = 8;
/** Radius of the circle (as % of half size) for slot centers. */
const WHEEL_SLOT_RADIUS_PERCENT = 38;

/**
 * Returns left/top in % for a slot on the wheel circle.
 * Each slot is placed in the center of its segment (between two divider lines).
 * Index 0 = first segment from 12 o'clock, then clockwise.
 */
function getSlotPositionOnCircle(index: number): { left: number; top: number } {
  const segmentAngle = 360 / WHEEL_SLOT_COUNT_CONST;
  const angleDeg = -90 + segmentAngle * (index + 0.5);
  const angleRad = (angleDeg * Math.PI) / 180;
  const left = 50 + WHEEL_SLOT_RADIUS_PERCENT * Math.cos(angleRad);
  const top = 50 + WHEEL_SLOT_RADIUS_PERCENT * Math.sin(angleRad);
  return { left, top };
}

/** Precomputed circle positions for each slot (for CSS classes, no inline styles). */
const SLOT_CIRCLE_POSITIONS = Array.from({ length: WHEEL_SLOT_COUNT_CONST }, (_, i) =>
  getSlotPositionOnCircle(i)
);

const POPUP_DELAY_MS = 3500;
const SPIN_DURATION_MS = 5500;
const SPIN_FULL_TURNS = 5;
const CELEBRATION_DURATION_MS = 1400;
const WHEEL_SLOT_COUNT = WHEEL_SLOT_COUNT_CONST;

/**
 * Wheel rotation (deg) so that slot at index i is under the pointer (12 o'clock).
 * Slot center starts at -90 + (i + 0.5) * segmentDeg.
 * To move it under the top pointer (-90deg), rotate wheel by -(i + 0.5) * segmentDeg.
 */
function getBaseAngleForSlot(slotIndex: number): number {
  const segmentDeg = 360 / WHEEL_SLOT_COUNT;
  return (360 - (slotIndex + 0.5) * segmentDeg) % 360;
}

function getPrizePreview(prize: SpinWheelPrize) {
  const matchedProduct = prize.products?.find((product) => product.productId === prize.productId);
  const productWithImage = prize.products?.find((product) =>
    Boolean(product.productImageUrl ?? product.imageUrl ?? product.image ?? product.url)
  );
  const firstProduct = matchedProduct ?? productWithImage ?? prize.products?.[0];
  const imageUrl =
    prize.productImageUrl ??
    firstProduct?.productImageUrl ??
    firstProduct?.imageUrl ??
    firstProduct?.image ??
    firstProduct?.url ??
    null;

  return {
    title: firstProduct?.productTitle || prize.productTitle || '',
    slug: firstProduct?.productSlug || prize.productSlug || '',
    imageUrl,
  };
}

export function SpinWheelPopup() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isLoading, isLoggedIn, isAdmin } = useAuth();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [prizes, setPrizes] = useState<SpinWheelPrize[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [wonPrize, setWonPrize] = useState<SpinWheelPrize | null>(null);
  const [remainingSpins, setRemainingSpins] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelTransitioning, setWheelTransitioning] = useState(false);
  const [pointerTickDurationMs, setPointerTickDurationMs] = useState(180);
  const spinEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visiblePrizes = useMemo(() => {
    if (prizes.length === 0) {
      return [];
    }

    const source = prizes
      .flatMap((prize) => {
        const prizeProducts = prize.products?.length
          ? prize.products
          : [
              {
                productId: prize.productId,
                productTitle: prize.productTitle,
                productSlug: prize.productSlug,
                productImageUrl: prize.productImageUrl,
              },
            ];

        return prizeProducts.map((product) => ({
          ...prize,
          productId: product.productId,
          productTitle: product.productTitle,
          productSlug: product.productSlug,
          productImageUrl: product.productImageUrl,
        }));
      })
      .slice(0, WHEEL_SLOT_COUNT);

    if (source.length === WHEEL_SLOT_COUNT) {
      return source;
    }
    return Array.from({ length: WHEEL_SLOT_COUNT }, (_, index) => source[index % source.length]);
  }, [prizes]);
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        angle: -80 + index * 8,
        distance: 95 + (index % 5) * 18,
        delay: (index % 6) * 40,
        rotate: (index % 2 === 0 ? 1 : -1) * (150 + (index % 4) * 45),
        color: ['#f8c56e', '#fff4de', '#f1bb7d', '#dba75f'][index % 4],
      })),
    []
  );

  useEffect(() => {
    if (!isCelebrating) {
      return;
    }

    const celebrationTimer = window.setTimeout(() => {
      setIsCelebrating(false);
    }, CELEBRATION_DURATION_MS);

    return () => {
      window.clearTimeout(celebrationTimer);
    };
  }, [isCelebrating]);

  useEffect(() => {
    if (isLoading || !isLoggedIn || isAdmin) {
      return;
    }

    if (pathname?.startsWith('/admin')) {
      return;
    }

    const delayTimer = window.setTimeout(async () => {
      try {
        setLoading(true);

        const response = await apiClient.get<ActivePrizesResponse>('/api/v1/spin-wheel/active-prizes');
        const activePrizes = Array.isArray(response?.data) ? response.data : [];
        const remaining = response?.meta?.remainingSpins ?? 0;

        if (activePrizes.length === 0 || remaining <= 0) {
          return;
        }

        setPrizes(activePrizes);
        setRemainingSpins(remaining);
        setOpen(true);
      } catch {
        // Ignore popup fetch errors to keep user flow unaffected.
      } finally {
        setLoading(false);
      }
    }, POPUP_DELAY_MS);

    return () => {
      window.clearTimeout(delayTimer);
    };
  }, [isAdmin, isLoading, isLoggedIn, pathname]);

  const handleSpin = async () => {
    if (spinning || visiblePrizes.length === 0 || remainingSpins <= 0) {
      return;
    }

    setSpinning(true);
    setWonPrize(null);

    if (spinEndTimerRef.current) {
      clearTimeout(spinEndTimerRef.current);
      spinEndTimerRef.current = null;
    }

    try {
      const response = await apiClient.post<SpinResponse>('/api/v1/spin-wheel/spin');
      const prize = response.data.prize;
      const matchingIndexes = visiblePrizes
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.id === prize.id && item.productId === prize.productId)
        .map(({ index }) => index);
      const winnerIndex =
        matchingIndexes.length > 0
          ? matchingIndexes[Math.floor(Math.random() * matchingIndexes.length)]
          : visiblePrizes.findIndex((p) => p.id === prize.id && p.productId === prize.productId) >= 0
            ? visiblePrizes.findIndex((p) => p.id === prize.id && p.productId === prize.productId)
            : visiblePrizes.findIndex((p) => p.id === prize.id) >= 0
              ? visiblePrizes.findIndex((p) => p.id === prize.id)
            : 0;

      const baseAngle = getBaseAngleForSlot(winnerIndex);
      const currentRot = wheelRotation % 360;
      const delta = (baseAngle - currentRot + 360) % 360;
      const targetRotation = wheelRotation + SPIN_FULL_TURNS * 360 + delta;
      const segmentDegrees = 360 / WHEEL_SLOT_COUNT;
      const crossedSegments = Math.max(1, Math.round((targetRotation - wheelRotation) / segmentDegrees));
      const tickDuration = Math.max(130, Math.round((SPIN_DURATION_MS / crossedSegments) * 2.15));

      setPointerTickDurationMs(tickDuration);
      setWheelTransitioning(true);
      setWheelRotation(targetRotation);

      spinEndTimerRef.current = setTimeout(() => {
        spinEndTimerRef.current = null;
        setWheelTransitioning(false);
        setHighlightedIndex(winnerIndex);
        setWonPrize(prize);
        setIsCelebrating(true);
        setRemainingSpins((prev) => Math.max(0, prev - 1));
        setSpinning(false);
      }, SPIN_DURATION_MS);
    } catch {
      setSpinning(false);
      setWheelTransitioning(false);
      alert('Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      if (spinEndTimerRef.current) clearTimeout(spinEndTimerRef.current);
    };
  }, []);

  const wonPrizePreview = wonPrize ? getPrizePreview(wonPrize) : null;

  if (!open || loading || visiblePrizes.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#081311]/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,244,222,0.14),_transparent_34%),linear-gradient(145deg,_rgba(34,51,49,0.96),_rgba(15,27,25,0.98))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_36%,transparent_64%,rgba(255,255,255,0.04))]" />
        <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-[#fff4de]/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-12 h-40 w-40 rounded-full bg-[#f8c56e]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-52 w-52 rounded-full bg-[#76c6b4]/12 blur-3xl" />
        <div className="pointer-events-none absolute top-4 right-4 w-32 h-36 md:w-40 md:h-44 opacity-35" aria-hidden>
          <img src="/hero-vector-1.svg" alt="" className="h-full w-full object-contain object-top object-right" />
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 w-32 h-36 md:w-40 md:h-44 opacity-35 rotate-180" aria-hidden>
          <img src="/hero-vector-1.svg" alt="" className="h-full w-full object-contain object-bottom object-left" />
        </div>
        {isCelebrating && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <div className="celebrate-flash absolute inset-0" />
            {confettiPieces.map((piece) => {
              const pieceStyle = {
                left: '50%',
                top: '52%',
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}ms`,
                '--confetti-x': `${Math.cos((piece.angle * Math.PI) / 180) * piece.distance}px`,
                '--confetti-y': `${Math.sin((piece.angle * Math.PI) / 180) * piece.distance}px`,
                '--confetti-r': `${piece.rotate}deg`,
              } as CSSProperties;

              return <span key={piece.id} className="confetti-piece" style={pieceStyle} />;
            })}
          </div>
        )}
        <button
          type="button"
          aria-label={t('common.buttons.close')}
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[#fff4de] backdrop-blur transition-all hover:scale-105 hover:bg-white/15"
        >
          ×
        </button>

        <div className="relative z-[1] mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#f8c56e]/30 bg-[#f8c56e]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f8d899]">
              Lucky Drop
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#fff4de] md:text-4xl">
              {t('home.spinWheel.title')}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#fff4de]/72">{t('home.spinWheel.subtitle')}</p>
          </div>
          <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
            <div className="mr-3 h-2.5 w-2.5 rounded-full bg-[#7ef2c6] shadow-[0_0_12px_rgba(126,242,198,0.95)]" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#fff4de]/55">Spins left</p>
              <p className="text-lg font-semibold text-white">{remainingSpins}</p>
            </div>
          </div>
        </div>

        <div className="relative z-[1] mx-auto">
          <div className="pointer-events-none absolute inset-6 rounded-full bg-[radial-gradient(circle,_rgba(248,197,110,0.3),_transparent_62%)] blur-2xl" />
          <div className="mx-auto relative h-[22rem] w-[22rem] rounded-full border border-white/12 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.06),rgba(255,255,255,0.015),rgba(255,255,255,0.07),rgba(255,255,255,0.015),rgba(255,255,255,0.06))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(5,14,13,0.55)] md:h-[25rem] md:w-[25rem]">
            <div className="absolute inset-[18px] rounded-full border-[10px] border-[#f5d9a8]/80 bg-[radial-gradient(circle_at_50%_35%,#fff4de_0%,#f4d59d_34%,#d9aa67_100%)] shadow-[inset_0_10px_22px_rgba(255,255,255,0.35),inset_0_-14px_24px_rgba(120,78,23,0.22),0_0_0_10px_rgba(255,255,255,0.05)]" />
          <div
            className={`absolute left-1/2 -top-[18px] z-10 -translate-x-1/2 ${wheelTransitioning ? 'pointer-tick' : ''}`}
            style={
              wheelTransitioning
                ? ({ ['--pointer-tick-duration' as string]: `${pointerTickDurationMs}ms` } as CSSProperties)
                : undefined
            }
          >
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full border border-[#f8d899]/70 bg-[#fff4de] shadow-[0_10px_24px_rgba(248,197,110,0.45)]" />
              <div
                className={`-mt-2 h-0 w-0 border-x-[18px] border-t-[26px] border-x-transparent border-t-[#fff4de] drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)] ${wheelTransitioning ? 'pointer-tip-tick' : ''}`}
                style={
                  wheelTransitioning
                    ? ({ ['--pointer-tick-duration' as string]: `${pointerTickDurationMs}ms` } as CSSProperties)
                    : undefined
                }
              />
            </div>
          </div>
          <div
            className="absolute inset-[18px] rounded-full will-change-transform"
            style={{
              transform: `rotate(${wheelRotation}deg)`,
              transition: wheelTransitioning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
                : 'none',
            }}
          >
            {Array.from({ length: WHEEL_SLOT_COUNT }, (_, i) => (
              <div
                key={`divider-${i}`}
                className={`wheel-divider-${i} absolute left-1/2 top-1/2 h-px w-1/2 origin-left bg-[#2f3f3d]/50`}
              />
            ))}
            {visiblePrizes.map((prize, index) => {
              const isHighlighted = index === highlightedIndex;
              const preview = getPrizePreview(prize);
              return (
                <div
                  key={`${prize.id}-${prize.productId}-${index}`}
                  className={`wheel-slot-${index} absolute flex h-[108px] w-[124px] flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                    isHighlighted ? 'scale-[1.08]' : ''
                  }`}
                >
                  <div
                    className="flex h-full w-full flex-col items-center justify-center px-2 py-2 text-center"
                    style={{
                      transform: `rotate(${-wheelRotation}deg)`,
                      transition: wheelTransitioning
                        ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
                        : 'none',
                    }}
                  >
                    {preview.imageUrl ? (
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm">
                        <img src={preview.imageUrl} alt={preview.title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-black/15 bg-black/5 text-[8px]">
                        IMG
                      </div>
                    )}
                    <p
                      className={`mt-2 max-w-[110px] line-clamp-2 text-center text-[10px] font-semibold leading-tight ${
                        isHighlighted ? 'text-[#1d2927] drop-shadow-[0_2px_8px_rgba(255,255,255,0.7)]' : 'text-[#2f3f3d]'
                      }`}
                    >
                      {preview.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-[18px] flex items-center justify-center">
            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning || remainingSpins <= 0}
              className="spin-core relative flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-[#ffe7b9] bg-[radial-gradient(circle_at_35%_30%,#496661_0%,#243330_62%,#172220_100%)] text-[#fff4de] shadow-[0_18px_40px_rgba(10,20,18,0.45)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <div className="absolute inset-2 rounded-full border border-white/10" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(248,197,110,0.18),_transparent_60%)]" />
              <span className="relative text-sm font-extrabold tracking-[0.3em] text-[#fff4de]">SPIN</span>
            </button>
          </div>
        </div>
        </div>

        <div className="relative z-[1] mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="max-w-md text-sm leading-6 text-[#fff4de]/72">
            {t('home.spinWheel.remainingSpins').replace('{count}', String(remainingSpins))}
          </p>
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || remainingSpins <= 0}
            className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fff4de,#f7cb7d)] px-6 py-3 text-sm font-bold text-[#21312f] shadow-[0_16px_30px_rgba(248,197,110,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(248,197,110,0.34)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {spinning ? t('home.spinWheel.spinning') : t('home.spinWheel.spinNow')}
          </button>
        </div>

        {wonPrize && wonPrizePreview && (
          <div className="relative z-[1] mt-6 overflow-hidden rounded-[28px] border border-[#f8c56e]/30 bg-[linear-gradient(135deg,rgba(255,244,222,0.96),rgba(255,232,188,0.92))] p-5 shadow-[0_18px_40px_rgba(20,28,26,0.18)]">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#f8c56e]/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-white/45 blur-2xl" />
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8c5a16]">
              {t('home.spinWheel.youWon')}
            </p>
            <div className="relative flex items-center gap-4">
              {wonPrizePreview.imageUrl ? (
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-sm">
                  <img
                    src={wonPrizePreview.imageUrl}
                    alt={wonPrizePreview.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-[22px] bg-gray-200 text-xs text-gray-500">
                  {t('home.spinWheel.noImage')}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-[#2f3f3d]">{wonPrizePreview.title}</p>
                <p className="mt-1 text-sm text-[#6d4715]">
                  {t('home.spinWheel.winMessage').replace('{title}', wonPrizePreview.title)}
                </p>
                {wonPrizePreview.slug && (
                  <Link
                    href={`/products/${wonPrizePreview.slug}`}
                    className="mt-3 inline-flex items-center rounded-full border border-[#2f3f3d]/12 bg-white/65 px-4 py-2 text-sm font-medium text-[#2f3f3d] transition-colors hover:bg-white"
                  >
                    {t('home.spinWheel.viewProduct')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        ${SLOT_CIRCLE_POSITIONS.map(
          (pos, i) => `.wheel-slot-${i} { left: ${pos.left}%; top: ${pos.top}%; }`
        ).join('\n')}
        ${Array.from(
          { length: WHEEL_SLOT_COUNT },
          (_, i) =>
            `.wheel-divider-${i} { transform: translateY(-50%) rotate(${-90 + (360 / WHEEL_SLOT_COUNT) * i}deg); }`
        ).join('\n')}
        .confetti-piece {
          position: absolute;
          width: 7px;
          height: 14px;
          border-radius: 2px;
          opacity: 0;
          transform: translate(-50%, -50%);
          animation: confetti-burst 900ms ease-out forwards;
          box-shadow: 0 0 8px rgba(255, 244, 222, 0.45);
        }

        .celebrate-flash {
          background: radial-gradient(circle, rgba(255, 244, 222, 0.32) 0%, rgba(255, 244, 222, 0) 62%);
          animation: flash-fade 550ms ease-out forwards;
        }

        .pointer-tick {
          transform-origin: 50% 18%;
          animation: pointer-tick var(--pointer-tick-duration) ease-in-out infinite;
        }

        .pointer-tip-tick {
          transform-origin: 50% 0;
          animation: pointer-tip-tick var(--pointer-tick-duration) ease-in-out infinite;
        }

        .spin-core::after {
          content: '';
          position: absolute;
          inset: -14px;
          border-radius: 9999px;
          border: 1px solid rgba(248, 197, 110, 0.24);
          opacity: ${spinning ? 1 : 0.55};
          transform: scale(${spinning ? 1.08 : 1});
          transition: transform 220ms ease, opacity 220ms ease;
          animation: spin-core-pulse 1800ms ease-in-out infinite;
        }

        @keyframes confetti-burst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
          }
          18% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--confetti-x)), calc(-50% + var(--confetti-y)))
              scale(1) rotate(var(--confetti-r));
          }
        }

        @keyframes pointer-tick {
          0%,
          100% {
            transform: translateX(-50%) rotate(0deg);
          }
          35% {
            transform: translateX(-50%) rotate(-8deg) translateY(-2px);
          }
          70% {
            transform: translateX(-50%) rotate(1deg);
          }
        }

        @keyframes pointer-tip-tick {
          0%,
          100% {
            transform: rotate(0deg);
          }
          35% {
            transform: rotate(-10deg);
          }
          70% {
            transform: rotate(2deg);
          }
        }

        @keyframes flash-fade {
          0% {
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes spin-core-pulse {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}
