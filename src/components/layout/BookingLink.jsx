"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readSessionToken } from "@/lib/session";
import { apiRequest } from "@/lib/api";
import { saveBookingSelection } from "@/lib/bookingSelection";

export default function BookingLink({ routeId, busId, seatNumber, className, children, ...props }) {
  const router = useRouter();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const linkProps = Object.fromEntries(Object.entries(props).filter(([key]) => key !== "href"));
  const routeParam = routeId ? `bookingRoute=${encodeURIComponent(routeId)}${busId ? `&bookingBus=${encodeURIComponent(busId)}` : ""}${seatNumber ? `&bookingSeat=${encodeURIComponent(seatNumber)}` : ""}` : "booking=1";
  const href = `/login?${routeParam}`;

  async function openBooking(event) {
    event.preventDefault();
    if (!online) return;
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

  if (!online) {
    return (
      <button
        type="button"
        disabled
        className={`${className || ""} cursor-not-allowed opacity-60`}
        title="Internet connection required to book seats"
        {...linkProps}
      >
        <span>Needs internet</span>
        <span aria-hidden="true">✕</span>
      </button>
    );
  }

  return <Link href={href} onClick={openBooking} className={className} {...linkProps}>{children}</Link>;
}
