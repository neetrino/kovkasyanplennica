'use client';

import { useTranslation } from '../../../../lib/i18n-client';

interface OrderStatusProps {
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  pending:    { bg: 'bg-yellow-400/10 border-yellow-400/30', text: 'text-yellow-300', dot: 'bg-yellow-400', icon: null },
  confirmed:  { bg: 'bg-blue-400/10 border-blue-400/30',    text: 'text-blue-300',   dot: 'bg-blue-400',   icon: null },
  processing: { bg: 'bg-purple-400/10 border-purple-400/30',text: 'text-purple-300', dot: 'bg-purple-400', icon: null },
  shipped:    { bg: 'bg-indigo-400/10 border-indigo-400/30',text: 'text-indigo-300', dot: 'bg-indigo-400', icon: null },
  delivered:  { bg: 'bg-[#7CB342]/15 border-[#7CB342]/30',  text: 'text-[#7CB342]', dot: 'bg-[#7CB342]',  icon: null },
  completed:  { bg: 'bg-[#7CB342]/15 border-[#7CB342]/30',  text: 'text-[#7CB342]', dot: 'bg-[#7CB342]',  icon: null },
  cancelled:  { bg: 'bg-red-400/10 border-red-400/30',       text: 'text-red-400',   dot: 'bg-red-400',    icon: null },
  paid:       { bg: 'bg-[#7CB342]/15 border-[#7CB342]/30',  text: 'text-[#7CB342]', dot: 'bg-[#7CB342]',  icon: null },
  unpaid:     { bg: 'bg-yellow-400/10 border-yellow-400/30', text: 'text-yellow-300',dot: 'bg-yellow-400', icon: null },
  unfulfilled:{ bg: 'bg-[#3d504e] border-[#3d504e]',         text: 'text-[#fff4de]/50', dot: 'bg-[#fff4de]/30', icon: null },
  fulfilled:  { bg: 'bg-[#7CB342]/15 border-[#7CB342]/30',  text: 'text-[#7CB342]', dot: 'bg-[#7CB342]',  icon: null },
};

const FALLBACK = { bg: 'bg-[#3d504e] border-[#3d504e]', text: 'text-[#fff4de]/50', dot: 'bg-[#fff4de]/30', icon: null };

function StatusBadge({ label, value }: { label: string; value: string }) {
  const cfg = STATUS_CONFIG[value.toLowerCase()] ?? FALLBACK;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className="text-[#fff4de]/40 font-normal normal-case">{label}</span>
      <span>{value}</span>
    </div>
  );
}

const ORDER_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function getStepIndex(status: string): number {
  return ORDER_STEPS.indexOf(status.toLowerCase());
}

export function OrderStatus({ status, paymentStatus, fulfillmentStatus }: OrderStatusProps) {
  const { t } = useTranslation();
  const currentStep = getStepIndex(status);
  const isCancelled = status.toLowerCase() === 'cancelled';

  return (
    <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
        <svg className="w-5 h-5 text-[#7CB342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h2 className="text-[#fff4de] font-light italic text-lg">{t('orders.orderStatus.title')}</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Status badges row */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={t('orders.orderStatus.title')} value={status} />
          <StatusBadge label={t('orders.orderSummary.shipping')} value={paymentStatus} />
          <StatusBadge label={t('checkout.summary.shipping')} value={fulfillmentStatus} />
        </div>

        {/* Progress timeline */}
        {!isCancelled && (
          <div className="pt-2">
            <div className="flex items-center">
              {ORDER_STEPS.map((step, i) => {
                const done = currentStep >= i;
                const active = currentStep === i;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    {/* Circle */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        done
                          ? 'bg-[#7CB342] border-[#7CB342]'
                          : 'bg-[#2F3F3D] border-[#3d504e]'
                      } ${active ? 'ring-2 ring-[#7CB342]/30' : ''}`}>
                        {done ? (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#3d504e]" />
                        )}
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider mt-1.5 hidden sm:block ${
                        done ? 'text-[#7CB342]' : 'text-[#fff4de]/30'
                      }`}>
                        {step}
                      </span>
                    </div>
                    {/* Connector */}
                    {i < ORDER_STEPS.length - 1 && (
                      <div className={`flex-1 h-[2px] mx-1 transition-colors ${
                        currentStep > i ? 'bg-[#7CB342]' : 'bg-[#3d504e]'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-3 p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">Order has been cancelled</p>
          </div>
        )}
      </div>
    </div>
  );
}
