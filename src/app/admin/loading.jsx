import { Skeleton, SkeletonList } from "@/components/ui/skeleton/Skeleton";
import DelayedSkeleton from "@/components/ui/skeleton/DelayedSkeleton";

export default function AdminLoading() {
  return <DelayedSkeleton><section aria-label="Loading administrator workspace" className="space-y-5"><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-2xl bg-white p-4"><Skeleton className="h-3 w-2/5" /><Skeleton className="mt-4 h-7 w-1/3" /></div>)}</div><SkeletonList count={3} /></section></DelayedSkeleton>;
}
