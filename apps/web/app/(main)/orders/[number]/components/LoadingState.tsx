'use client';

export function LoadingState() {
  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] md:w-[700px] aspect-square max-h-[700px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 animate-pulse">
        {/* Header */}
        <div className="mb-10">
          <div className="h-3 bg-[#3d504e] rounded w-20 mb-3" />
          <div className="h-10 bg-[#3d504e] rounded-lg w-64 mb-4" />
          <div className="h-[2px] bg-[#3d504e] w-16 mb-3" />
          <div className="h-3 bg-[#3d504e] rounded w-40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {/* Status card */}
            <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 space-y-4">
              <div className="h-4 bg-[#3d504e] rounded w-32" />
              <div className="flex gap-3">
                <div className="h-7 bg-[#3d504e] rounded-full w-24" />
                <div className="h-7 bg-[#3d504e] rounded-full w-28" />
                <div className="h-7 bg-[#3d504e] rounded-full w-24" />
              </div>
            </div>

            {/* Items card */}
            <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 space-y-5">
              <div className="h-4 bg-[#3d504e] rounded w-28" />
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 pb-5 border-b border-[#3d504e] last:border-0">
                  <div className="w-20 h-20 bg-[#3d504e] rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-[#3d504e] rounded w-3/4" />
                    <div className="h-3 bg-[#3d504e] rounded w-1/3" />
                    <div className="h-3 bg-[#3d504e] rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-[#3d504e] rounded w-16 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 space-y-4 h-fit">
            <div className="h-5 bg-[#3d504e] rounded w-32" />
            <div className="h-[1px] bg-[#3d504e] w-12" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 bg-[#3d504e] rounded w-20" />
                <div className="h-3 bg-[#3d504e] rounded w-16" />
              </div>
            ))}
            <div className="h-12 bg-[#3d504e] rounded-xl mt-2" />
            <div className="h-10 bg-[#3d504e]/60 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
