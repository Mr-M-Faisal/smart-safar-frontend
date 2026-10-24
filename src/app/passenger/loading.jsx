import { Skeleton, SkeletonList } from "@/components/ui/skeleton/Skeleton";
import DelayedSkeleton from "@/components/ui/skeleton/DelayedSkeleton";

export default function PassengerLoading() {
  return <DelayedSkeleton><section aria-label="Loading passenger data" className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-2xl bg-white p-4"><Skeleton className="h-3 w-2/5" /><Skeleton className="mt-4 h-7 w-1/3" /></div>)}</div><SkeletonList count={2} /></section></DelayedSkeleton>;
}
