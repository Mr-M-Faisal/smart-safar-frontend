import { SkeletonList } from "@/components/ui/skeleton/Skeleton";
import DelayedSkeleton from "@/components/ui/skeleton/DelayedSkeleton";

export default function PublicLoading() {
  return <DelayedSkeleton className="min-h-[70vh]"><main aria-label="Loading page" className="min-h-[70vh] bg-[#f4f5fb] px-4 py-8 sm:px-8 lg:px-12">
    <div className="mx-auto max-w-6xl"><div className="mb-7 h-9 w-64 animate-pulse rounded-lg bg-[#e2e6f2]" /><SkeletonList count={3} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" /></div>
  </main></DelayedSkeleton>;
}
