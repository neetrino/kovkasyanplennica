'use client';

/**
 * Loading state component for CategoryNavigation
 */
export function CategoryNavigationLoading() {
  return (
    <div className="bg-[#2F3F3D] border-b border-[#3d504e] py-3 sm:py-4 md:py-6 w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 sm:gap-3 min-w-[104px] sm:min-w-[132px]">
              <div className="w-[80px] h-[80px] sm:w-[104px] sm:h-[104px] rounded-full bg-gray-600 animate-pulse"></div>
              <div className="w-20 sm:w-28 h-3 sm:h-4 bg-gray-600 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}








