export default function ProductsLoading() {
  return (
    <div className="w-full max-w-full bg-[#2F3F3D]" aria-busy aria-label="Loading products">
      <div className="h-0.5 w-full overflow-hidden bg-[#fff4de]/15">
        <div className="h-full w-2/5 rounded-full bg-[#75bf5e] animate-main-route-progress" />
      </div>

      <div className="border-b border-[#3d504e] py-3 sm:py-4 md:py-6">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-hidden px-2 sm:px-4 md:px-6 lg:px-8">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex min-w-[88px] flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse sm:h-20 sm:w-20" />
              <div className="h-3 w-16 rounded-full bg-white/10 animate-pulse sm:h-4 sm:w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-[80px] sm:px-6 sm:pt-[110px] lg:px-8">
        {Array.from({ length: 2 }).map((_, rowIndex) => (
          <section key={rowIndex} className="mb-14 last:mb-0">
            <div className="mb-10 h-10 w-44 rounded-full bg-white/10 animate-pulse" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="overflow-hidden rounded-[24px] border border-white/10 bg-[#364744]"
                >
                  <div className="aspect-square bg-white/10 animate-pulse" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-4 w-full rounded-full bg-white/10 animate-pulse" />
                    <div className="h-5 w-24 rounded-full bg-[#75bf5e]/40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
