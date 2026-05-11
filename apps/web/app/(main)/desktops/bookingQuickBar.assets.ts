import { toR2Url } from '@/lib/r2-assets';

const BASE = '/assets/desktops/booking-bar';

export const bookingQuickBarAssets = {
  calendar: toR2Url(`${BASE}/e9e3bf993d4c694aeee6c9e236096c815a3c2dae.svg`),
  chevron: toR2Url(`${BASE}/5722b897d47ccf534afad7bf1ef2891ea81fa9a1.svg`),
  clock: toR2Url(`${BASE}/4f12f2f2bdd78130feac81acd54cd47ff2d7f811.svg`),
  guests: toR2Url(`${BASE}/38b7515e7ba2b99d42b0d79664b435d925ff6ba4.svg`),
} as const;
