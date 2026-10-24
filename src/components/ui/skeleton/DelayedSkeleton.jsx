"use client";

import useDelayedLoading from "@/lib/useDelayedLoading";

export default function DelayedSkeleton({ children, className = "min-h-24" }) {
  const visible = useDelayedLoading(true, { delay: 150, minDuration: 300 });
  return <div className={className}>{visible ? children : <div aria-hidden="true" className="min-h-24" />}</div>;
}
