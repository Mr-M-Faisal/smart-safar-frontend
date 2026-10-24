import DelayedSkeleton from "@/components/ui/skeleton/DelayedSkeleton";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton/Skeleton";

export default function MobileAppLoading() {
  return <DelayedSkeleton className="min-h-dvh bg-[#f4f5fb] px-5 py-6"><main aria-label="Loading mobile app" className="mx-auto max-w-[430px]"><Skeleton className="h-6 w-36" /><Skeleton className="mt-8 h-8 w-52" /><SkeletonCard className="mt-6 h-36" /><SkeletonCard className="mt-3 h-24" /></main></DelayedSkeleton>;
}
