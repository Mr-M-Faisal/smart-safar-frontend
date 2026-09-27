"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { readSessionToken } from "@/lib/session";
import { apiRequest } from "@/lib/api";

export default function BookingLink({ routeId, className, children, ...props }) {
  const router = useRouter();
  const linkProps = Object.fromEntries(Object.entries(props).filter(([key]) => key !== "href"));
  const routeParam = routeId ? `bookingRoute=${encodeURIComponent(routeId)}` : "booking=1";
  const href = `/login?${routeParam}`;

  async function openBooking(event) {
    event.preventDefault();
    const token = readSessionToken();
    if (!token) { router.push(href); return; }
    try {
      const profile = await apiRequest("/auth/profile", { token });
      if (profile.role === "commuter") {
        router.push(`/passenger${routeId ? `?routeId=${encodeURIComponent(routeId)}` : ""}#booking`);
        return;
      }
    } catch {
      // Send users with an invalid or unverifiable session to sign-in.
    }
    router.push(href);
  }

  return <Link href={href} onClick={openBooking} className={className} {...linkProps}>{children}</Link>;
}
