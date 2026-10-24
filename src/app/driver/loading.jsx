import { Skeleton, SkeletonCard, SkeletonList } from "@/components/ui/skeleton/Skeleton";
import DelayedSkeleton from "@/components/ui/skeleton/DelayedSkeleton";

export default function DriverLoading() {
  return <DelayedSkeleton><section aria-label="Loading driver workspace" className="space-y-5"><SkeletonCard className="min-h-36" /><div className="grid gap-4 lg:grid-cols-2"><SkeletonList count={2} /><div className="rounded-2xl bg-white p-5"><Skeleton className="h-5 w-1/3" /><Skeleton className="mt-5 h-48 w-full" /></div></div></section></DelayedSkeleton>;
}
