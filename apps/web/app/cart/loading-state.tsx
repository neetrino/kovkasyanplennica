'use client';

export function LoadingState() {
  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">

      {/* Decorative overlay */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[600px] aspect-square max-h-[600px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 animate-pulse">

        {/* Title skeleton */}
        <div className="mb-10">
          <div className="h-3 bg-[#3d504e] rounded w-24 mb-3" />
          <div className="h-10 bg-[#3d504e] rounded-lg w-48 mb-4" />
          <div className="h-[2px] bg-[#3d504e] w-16" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cart table skeleton */}
          <div className="lg:col-span-2 bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
              <div className="h-3 bg-[#3d504e] rounded w-1/3" />
            </div>
            {/* Item rows */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 px-6 py-6 border-b border-[#3d504e] last:border-0">
                <div className="w-24 h-24 rounded-xl bg-[#3d504e] flex-shrink-0" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-4 bg-[#3d504e] rounded w-3/4" />
                  <div className="h-3 bg-[#3d504e] rounded w-1/3" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-8 bg-[#3d504e] rounded-lg w-28" />
                  <div className="h-4 bg-[#3d504e] rounded w-16" />
                </div>
              </div>
            ))}
          </div>

          {/* Order summary skeleton */}
          <div className="lg:col-span-1 bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 space-y-4">
            <div className="h-6 bg-[#3d504e] rounded w-2/3" />
            <div className="h-[1px] bg-[#3d504e] w-12" />
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 bg-[#3d504e] rounded w-20" />
                  <div className="h-3 bg-[#3d504e] rounded w-16" />
                </div>
              ))}
              <div className="border-t border-[#3d504e] pt-4 flex justify-between">
                <div className="h-5 bg-[#3d504e] rounded w-16" />
                <div className="h-5 bg-[#3d504e] rounded w-24" />
              </div>
            </div>
            <div className="h-12 bg-[#3d504e] rounded-xl" />
            <div className="h-10 bg-[#3d504e]/60 rounded-xl" />
          </div>

        </div>
      </div>
    </div>
  );
}
