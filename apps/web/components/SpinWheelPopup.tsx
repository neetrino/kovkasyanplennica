'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
const SPIN_MIN_STEP_DELAY_MS = 65;
const SPIN_MAX_STEP_DELAY_MS = 230;
const SPIN_EXTRA_LOOPS = 4;
const CELEBRATION_DURATION_MS = 1400;
const WHEEL_SLOT_COUNT = WHEEL_SLOT_COUNT_CONST;

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getPrizePreview(prize: SpinWheelPrize) {
  const productWithImage = prize.products?.find((product) =>
    Boolean(product.productImageUrl ?? product.imageUrl ?? product.image ?? product.url)
  );
  const firstProduct = productWithImage ?? prize.products?.[0];
  const imageUrl =
    firstProduct?.productImageUrl ??
    firstProduct?.imageUrl ??
    firstProduct?.image ??
    firstProduct?.url ??
    prize.productImageUrl;

  return {
    title: firstProduct?.productTitle ?? prize.productTitle,
    slug: firstProduct?.productSlug ?? prize.productSlug,
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
  const [pointerTick, setPointerTick] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const visiblePrizes = useMemo(() => {
    if (prizes.length === 0) {
      return [];
    }
    const source = prizes.slice(0, WHEEL_SLOT_COUNT);
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
        const activePrizes = response.data || [];

        if (activePrizes.length === 0 || response.meta.remainingSpins <= 0) {
          return;
        }

        setPrizes(activePrizes);
        setRemainingSpins(response.meta.remainingSpins);
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

    try {
      const response = await apiClient.post<SpinResponse>('/api/v1/spin-wheel/spin');
      const prize = response.data.prize;
      const slotsCount = visiblePrizes.length;
      const finalIndex = visiblePrizes.findIndex((p) => p.id === prize.id);
      const matchingIndexes = visiblePrizes
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.id === prize.id)
        .map(({ index }) => index);
      const safeFinalIndex =
        matchingIndexes.length > 0
          ? matchingIndexes[Math.floor(Math.random() * matchingIndexes.length)]
          : finalIndex >= 0
            ? finalIndex
            : 0;
      const startIndex = highlightedIndex;
      const stepsToTarget = (safeFinalIndex - startIndex + slotsCount) % slotsCount;
      const totalSteps = SPIN_EXTRA_LOOPS * slotsCount + stepsToTarget;
      const rotationStep = 360 / slotsCount;

      for (let step = 0; step < totalSteps; step += 1) {
        const nextIndex = (startIndex + step + 1) % slotsCount;
        const progress = step / Math.max(1, totalSteps - 1);
        const easedProgress = progress ** 2.2;
        const stepDelay =
          SPIN_MIN_STEP_DELAY_MS +
          Math.round((SPIN_MAX_STEP_DELAY_MS - SPIN_MIN_STEP_DELAY_MS) * easedProgress);

        setHighlightedIndex(nextIndex);
        setWheelRotation((prev) => prev + rotationStep);
        setPointerTick((prev) => !prev);
        await wait(stepDelay);
      }

      setHighlightedIndex(safeFinalIndex);
      setPointerTick(false);
      setWonPrize(prize);
      setIsCelebrating(true);
      setRemainingSpins((prev) => Math.max(0, prev - 1));
      setSpinning(false);
    } catch {
      setSpinning(false);
      alert('Something went wrong. Please try again.');
    }
  };

  if (!open || loading || visiblePrizes.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#fff4de]/15 bg-gradient-to-b from-[#354846] to-[#273633] shadow-2xl p-5 md:p-7">
        <div className="pointer-events-none absolute -top-24 -left-16 h-52 w-52 rounded-full bg-[#fff4de]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-44 w-44 rounded-full bg-[#f1bb7d]/20 blur-3xl" />
        {/* Декоративный вектор: верх справа и низ слева */}
        <div className="pointer-events-none absolute top-4 right-4 w-32 h-36 md:w-40 md:h-44 opacity-40" aria-hidden>
          <img src="/hero-vector-1.svg" alt="" className="h-full w-full object-contain object-top object-right" />
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 w-32 h-36 md:w-40 md:h-44 opacity-40 rotate-180" aria-hidden>
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
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full border border-[#fff4de]/30 bg-[#fff4de]/10 text-[#fff4de] transition-colors hover:bg-[#fff4de]/20"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-[#fff4de] mb-2">{t('home.spinWheel.title')}</h2>
        <p className="text-sm text-[#fff4de]/80 mb-6">{t('home.spinWheel.subtitle')}</p>

        <div className="mx-auto relative h-80 w-80 rounded-full border-[10px] border-[#fff4de]/70 bg-gradient-to-br from-[#f8e3bf] to-[#e3c494] shadow-[0_0_0_8px_rgba(47,63,61,0.7)]">
          <div
            className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[#f8c56e] drop-shadow text-3xl origin-bottom transition-transform duration-100 ${
              spinning ? (pointerTick ? '-rotate-12' : 'rotate-0') : 'rotate-0'
            }`}
          >
            ▼
          </div>
          <div
            className="absolute inset-0 rounded-full transition-transform will-change-transform"
            style={{ transform: `rotate(${wheelRotation}deg)` }}
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
                  key={prize.id}
                  className={`wheel-slot-${index} absolute flex h-[74px] w-[108px] flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all ${
                    isHighlighted ? 'scale-110' : ''
                  }`}
                >
                  <div
                    className="flex h-full w-full flex-col items-center justify-center"
                    style={{ transform: `rotate(${-wheelRotation}deg)` }}
                  >
                    {preview.imageUrl ? (
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
                        <img src={preview.imageUrl} alt={preview.title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-black/20 bg-black/5 text-[8px]">
                        IMG
                      </div>
                    )}
                    <p
                      className={`mt-1 text-[10px] leading-tight font-semibold line-clamp-2 text-center ${
                        isHighlighted ? 'text-[#1d2927] drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' : 'text-[#2f3f3d]'
                      }`}
                    >
                      {preview.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-24 w-24 rounded-full bg-[#2f3f3d] text-[#fff4de] border-4 border-[#f4dcb3] flex items-center justify-center text-sm font-bold shadow-xl">
              SPIN
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-[#fff4de]/85">
            {t('home.spinWheel.remainingSpins').replace('{count}', String(remainingSpins))}
          </p>
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || remainingSpins <= 0}
            className="rounded-xl bg-[#fff4de] text-[#2f3f3d] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {spinning ? t('home.spinWheel.spinning') : t('home.spinWheel.spinNow')}
          </button>
        </div>

        {wonPrize && (
          <div className="mt-6 rounded-2xl border border-[#f1bb7d]/60 bg-[#fff4de] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8c5a16] mb-3">
              {t('home.spinWheel.youWon')}
            </p>
            <div className="flex items-center gap-4">
              {getPrizePreview(wonPrize).imageUrl ? (
                <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={getPrizePreview(wonPrize).imageUrl || ''}
                    alt={getPrizePreview(wonPrize).title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  {t('home.spinWheel.noImage')}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#2f3f3d] text-lg">{getPrizePreview(wonPrize).title}</p>
                <p className="text-sm text-[#6d4715] mt-1">
                  {t('home.spinWheel.winMessage').replace('{title}', getPrizePreview(wonPrize).title)}
                </p>
                {getPrizePreview(wonPrize).slug && (
                  <Link
                    href={`/products/${getPrizePreview(wonPrize).slug}`}
                    className="inline-block mt-2 text-sm font-medium text-[#2f3f3d] underline hover:text-[#1d2927]"
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
      `}</style>
    </div>
  );
}
