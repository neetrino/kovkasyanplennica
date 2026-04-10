export default function AboutLoading() {
  return (
    <div className="w-full max-w-full bg-[#2F3F3D]" aria-busy aria-label="Loading about page">
      <div className="h-0.5 w-full overflow-hidden bg-[#fff4de]/15">
        <div className="h-full w-2/5 rounded-full bg-[#75bf5e] animate-main-route-progress" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pt-4 sm:pt-6 md:pt-8 pb-16 md:pb-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="h-[380px] rounded-[24px] bg-white/10 animate-pulse md:h-[500px]" />
        <div className="space-y-5">
          <div className="h-4 w-32 rounded-full bg-[#75bf5e]/40 animate-pulse" />
          <div className="h-12 w-64 rounded-full bg-white/10 animate-pulse" />
          <div className="h-4 w-full rounded-full bg-white/10 animate-pulse" />
          <div className="h-4 w-11/12 rounded-full bg-white/10 animate-pulse" />
          <div className="h-4 w-10/12 rounded-full bg-white/10 animate-pulse" />
          <div className="h-4 w-full rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
