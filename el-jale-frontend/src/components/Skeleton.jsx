// src/components/Skeleton.jsx
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-gray-200 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-full mt-2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="p-5 animate-pulse border-b border-gray-100">
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-24" />
    </div>
  );
}
