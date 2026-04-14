export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-start">
        <div className="rounded-3xl bg-gray-100 h-[420px]" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 rounded bg-gray-100" />
          <div className="h-6 w-1/2 rounded bg-gray-100" />
          <div className="h-16 w-full rounded bg-gray-100" />
          <div className="h-14 w-1/3 rounded bg-gray-100" />
          <div className="h-12 w-full rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-24 h-40 rounded-3xl bg-gray-100" />
      <div className="mt-16 h-56 rounded-3xl bg-gray-100" />
    </div>
  );
}
