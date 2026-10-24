export function Skeleton({ className = "" }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-lg bg-[#e8ebf5] ${className}`} />;
}

export function SkeletonCard({ className = "" }) {
  return <div aria-hidden="true" className={`rounded-2xl border border-[#e8ebf4] bg-white p-5 shadow-[0_8px_22px_rgba(53,67,112,.04)] ${className}`}>
    <Skeleton className="h-4 w-2/5" /><Skeleton className="mt-4 h-3 w-4/5" /><Skeleton className="mt-2 h-3 w-3/5" />
  </div>;
}

export function SkeletonList({ count = 3, className = "" }) {
  return <div aria-label="Loading content" className={`space-y-3 ${className}`}>
    {Array.from({ length: count }, (_, index) => <SkeletonCard key={index} />)}
  </div>;
}

export function MapSkeleton({ className = "" }) {
  return <div role="status" aria-label="Loading map" className={`map-grid-light relative min-h-[280px] overflow-hidden rounded-[1.35rem] bg-[#e9edf7] sm:min-h-[360px] ${className}`}>
    <span className="absolute inset-x-3 top-3 h-12 rounded-xl border border-white/80 bg-white/75 shadow-sm sm:inset-x-5" />
    <span className="absolute bottom-5 left-5 h-9 w-40 rounded-xl border border-white/80 bg-white/80 shadow-sm" />
  </div>;
}
