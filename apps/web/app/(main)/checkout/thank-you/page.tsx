import { Suspense } from 'react';
import { ThankYouClient } from './ThankYouClient';

function ThankYouFallback() {
  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-[#7CB342]/30 border-t-[#7CB342] animate-spin" aria-hidden />
    </div>
  );
}

export default function CheckoutThankYouPage() {
  return (
    <Suspense fallback={<ThankYouFallback />}>
      <ThankYouClient />
    </Suspense>
  );
}
