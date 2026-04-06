/**
 * Lightweight route transition — thin progress bar only (no blocking spinner).
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
    </div>
  );
}
