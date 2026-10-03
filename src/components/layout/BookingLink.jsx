"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { readSessionToken } from "@/lib/session";
import { apiRequest } from "@/lib/api";
import { saveBookingSelection } from "@/lib/bookingSelection";

export default function BookingLink({ routeId, busId, seatNumber, className, children, ...props }) {
  const router = useRouter();
  const linkProps = Object.fromEntries(Object.entries(props).filter(([key]) => key !== "href"));
  const routeParam = routeId ? `bookingRoute=${encodeURIComponent(routeId)}${busId ? `&bookingBus=${encodeURIComponent(busId)}` : ""}${seatNumber ? `&bookingSeat=${encodeURIComponent(seatNumber)}` : ""}` : "booking=1";
  const href = `/login?${routeParam}`;

  async function openBooking(event) {
    event.preventDefault();
    if (routeId) saveBookingSelection({ routeId, busId: busId || "" });
    const previewHref = `/booking-preview${routeId ? `?route=${encodeURIComponent(routeId)}${busId ? `&bus=${encodeURIComponent(busId)}` : ""}${seatNumber ? `&seat=${encodeURIComponent(seatNumber)}` : ""}` : "?booking=1"}`;
    const token = readSessionToken("commuter");
    if (!token) { router.push(previewHref); return; }
    try {
      const profile = await apiRequest("/auth/profile", { token });
      if (profile.role === "commuter") {
        router.push(`/passenger${routeId ? `?route=${encodeURIComponent(routeId)}${busId ? `&bus=${encodeURIComponent(busId)}` : ""}${seatNumber ? `&seat=${encodeURIComponent(seatNumber)}` : ""}` : ""}#booking`);
        return;
      }
    } catch {
      // Let guests preview real availability before asking them to sign in.
    }
    router.push(previewHref);
  }

  return <Link href={href} onClick={openBooking} className={className} {...linkProps}>{children}</Link>;
}
