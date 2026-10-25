"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { saveBookingSelection } from "@/lib/bookingSelection";

export default function BookingLink({ routeId, busId, seatNumber, requireAccount = false, className, children, ...props }) {
  const auth = useAuth();
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
  const routeQuery = routeId ? `route=${encodeURIComponent(routeId)}${busId ? `&bus=${encodeURIComponent(busId)}` : ""}${seatNumber ? `&seat=${encodeURIComponent(seatNumber)}` : ""}` : "booking=1";
  const previewHref = `/booking-preview?${routeQuery}`;
  const bookingHref = `/passenger?${routeQuery}#booking`;
  const signInHref = `/login?${routeId ? `bookingRoute=${encodeURIComponent(routeId)}${busId ? `&bookingBus=${encodeURIComponent(busId)}` : ""}${seatNumber ? `&bookingSeat=${encodeURIComponent(seatNumber)}` : ""}` : "booking=1"}`;
  const signUpQuery = routeId ? `bookingRoute=${encodeURIComponent(routeId)}${busId ? `&bookingBus=${encodeURIComponent(busId)}` : ""}${seatNumber ? `&bookingSeat=${encodeURIComponent(seatNumber)}` : ""}` : "booking=1";
  const signUpHref = `/login?mode=signup${auth.status === "authenticated" ? "&switch=1" : ""}&${signUpQuery}`;
  const href = auth.status === "authenticated" && auth.role === "commuter" ? bookingHref : requireAccount ? signUpHref : auth.status === "loading" ? signInHref : previewHref;

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

  return <Link href={href} onClick={() => { if (routeId) saveBookingSelection({ routeId, busId: busId || "" }); }} className={className} {...linkProps}>{children}</Link>;
}
