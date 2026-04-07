export default function AboutLoading() {
  return (
    <div className="w-full max-w-full bg-[#2F3F3D]" aria-busy aria-label="Loading about page">
      <div className="h-0.5 w-full overflow-hidden bg-[#fff4de]/15">
        <div className="h-full w-2/5 rounded-full bg-[#75bf5e] animate-main-route-progress" />
      </div>

      <section className="relative min-h-[420px] overflow-hidden">
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
        <div className="relative z-10 mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center px-4 text-center">
          <div className="mb-5 h-4 w-28 rounded-full bg-[#75bf5e]/40 animate-pulse" />
          <div className="mb-4 h-14 w-72 rounded-full bg-white/10 animate-pulse md:h-20 md:w-[28rem]" />
          <div className="h-2 w-40 rounded-full bg-white/10 animate-pulse" />
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
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
