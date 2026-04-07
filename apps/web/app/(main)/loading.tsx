/**
 * Shared segment loading shell — keeps transitions from feeling "empty"
 * while route data is streaming in.
 */
export default function MainSegmentLoading() {
  return (
    <div
      className="flex min-h-[40vh] w-full flex-1 flex-col bg-[#2f3f3d]"
      aria-busy
      aria-label="Loading"
    >
      <div className="h-0.5 w-full shrink-0 overflow-hidden bg-[#fff4de]/15">
        <div
          className="h-full w-2/5 rounded-full bg-[#75bf5e] animate-main-route-progress"
          role="presentation"
        />
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-10 w-40 rounded-full bg-white/10 animate-pulse" />
        <div className="grid min-h-[24vh] grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] bg-white/10 animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-40 rounded-full bg-white/10 animate-pulse" />
            <div className="h-16 w-3/4 rounded-[24px] bg-white/10 animate-pulse" />
            <div className="h-5 w-full rounded-full bg-white/10 animate-pulse" />
            <div className="h-5 w-5/6 rounded-full bg-white/10 animate-pulse" />
            <div className="mt-3 flex gap-3">
              <div className="h-12 w-36 rounded-full bg-[#75bf5e]/50 animate-pulse" />
              <div className="h-12 w-36 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#364744]">
              <div className="aspect-square bg-white/10 animate-pulse" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 rounded-full bg-white/10 animate-pulse" />
                <div className="h-4 w-full rounded-full bg-white/10 animate-pulse" />
                <div className="h-5 w-24 rounded-full bg-[#75bf5e]/40 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
