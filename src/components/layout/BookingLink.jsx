"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { readSessionToken } from "@/lib/session";

export default function BookingLink({ routeId, className, children, ...props }) {
  const router = useRouter();
  const linkProps = Object.fromEntries(Object.entries(props).filter(([key]) => key !== "href"));
  const routeParam = routeId ? `bookingRoute=${encodeURIComponent(routeId)}` : "booking=1";
  const href = `/login?${routeParam}`;

  function openBooking(event) {
    event.preventDefault();
    if (readSessionToken()) {
      router.push(`/passenger${routeId ? `?routeId=${encodeURIComponent(routeId)}` : ""}#booking`);
      return;
    }
    router.push(href);
  }

  return <Link href={href} onClick={openBooking} className={className} {...linkProps}>{children}</Link>;
}
