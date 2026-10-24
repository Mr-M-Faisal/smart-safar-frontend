"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import usePolling from "@/lib/usePolling";
import notifications from "./notifications.cjs";
function asList(value) { return Array.isArray(value) ? value : value?.items || value?.reports || value?.bookings || []; }
function createdAt(item) { return item.createdAt || item.updatedAt || new Date().toISOString(); }

export default function useNotifications(auth) {
  const [items, setItems] = useState([]);
  const [read, setRead] = useState(() => typeof window === "undefined" ? new Set() : notifications.readIds(window.localStorage));
  const token = auth?.token;
  const role = auth?.role;
  const refresh = useCallback(async () => {
    if (!token || !role) { setItems([]); return; }
    const next = [];
    if (role === "admin") {
      const [reports, shifts, failed, pending] = await Promise.allSettled([
        apiRequest("/reports?status=open", { token }), apiRequest("/admin/shifts", { token }),
        apiRequest("/admin/bookings?paymentStatus=failed", { token }), apiRequest("/admin/bookings?paymentStatus=pending", { token }),
      ]);
      if (reports.status === "fulfilled") asList(reports.value).filter((item) => item.status === "open").slice(0, 20).forEach((item) => next.push({ id: "report:" + item._id, title: "Passenger report", detail: item.description || item.reportType || "A new report needs review.", time: createdAt(item), href: "/m/admin/reports", icon: "Report" }));
      if (shifts.status === "fulfilled") asList(shifts.value).filter((shift) => shift.status === "active" && Date.now() - new Date(shift.heartbeatAt || shift.startedAt).getTime() > 180000).slice(0, 20).forEach((shift) => next.push({ id: "stale-gps:" + shift._id, title: "Bus GPS may be stale", detail: (shift.bus?.busNumber || "An active bus") + " has not sent a recent update.", time: shift.heartbeatAt || shift.startedAt, href: "/m/admin/buses", icon: "Map" }));
      for (const pair of [[failed, "failed", "Failed payment"], [pending, "pending", "Payment pending"]]) if (pair[0].status === "fulfilled") asList(pair[0].value).slice(0, 15).forEach((item) => next.push({ id: "payment:" + pair[1] + ":" + item._id + ":" + item.paymentStatus, title: pair[2], detail: "Booking " + String(item._id).slice(-6) + " needs attention.", time: createdAt(item), href: "/m/admin/bookings", icon: "Ticket" }));
    } else if (role === "driver") {
      const route = auth?.user?.activeShift?.route;
      const routeId = route?._id || route;
      const results = await Promise.allSettled([routeId ? apiRequest("/route-alerts/route/" + encodeURIComponent(routeId), { token }) : Promise.resolve([])]);
      if (results[0].status === "fulfilled") asList(results[0].value).slice(0, 30).forEach((alert) => next.push({ id: "driver-alert:" + alert._id, title: "Route alert", detail: alert.message, time: createdAt(alert), href: "/m/driver", icon: "Report" }));
      const shift = auth?.user?.activeShift;
      if (shift?.startedAt && Date.now() - new Date(shift.heartbeatAt || shift.startedAt).getTime() > 180000) next.push({ id: "driver-gps:" + (shift._id || shift.startedAt), title: "Check your GPS connection", detail: "Your shift has not sent a recent location update.", time: shift.heartbeatAt || shift.startedAt, href: "/m/driver", icon: "Map" });
    } else if (role === "commuter") {
      const results = await Promise.allSettled([apiRequest("/bookings/me", { token })]);
      if (results[0].status === "fulfilled") {
        const bookings = asList(results[0].value);
        bookings.filter((booking) => ["cancelled", "cancelled_by_service", "no_show", "completed", "boarded"].includes(booking.status)).slice(0, 20).forEach((booking) => next.push({ id: "booking:" + booking._id + ":" + booking.status + ":" + (booking.updatedAt || booking.createdAt), title: "Booking " + booking.status.replace(/_/g, " "), detail: (booking.route?.routeName || "Your trip") + " · Seat " + (booking.seatNumber || "—"), time: createdAt(booking), href: "/m/trips", icon: "Ticket" }));
        const routeIds = [...new Set(bookings.filter((booking) => ["confirmed", "pending"].includes(booking.status)).map((booking) => booking.route?._id || booking.route).filter(Boolean).map(String))].slice(0, 10);
        const alerts = await Promise.allSettled(routeIds.map((id) => apiRequest("/route-alerts/route/" + encodeURIComponent(id))));
        alerts.forEach((result) => { if (result.status === "fulfilled") asList(result.value).forEach((alert) => next.push({ id: "passenger-alert:" + alert._id, title: "Route update", detail: alert.message, time: createdAt(alert), href: "/m/routes", icon: "Report" })); });
      }
    }
    next.sort((a, b) => new Date(b.time) - new Date(a.time));
    setItems(next);
  }, [auth?.user?.activeShift, role, token]);
  useEffect(() => { void refresh(); }, [refresh]);
  usePolling(refresh, 45000, { enabled: Boolean(token && role), essential: false });
  const persistRead = useCallback((next) => { setRead(next); try { window.localStorage.setItem(notifications.STORAGE_KEY, JSON.stringify([...next].slice(-notifications.READ_LIMIT))); } catch {} }, []);
  const markAllRead = useCallback(() => persistRead(notifications.markAllRead(read, items)), [items, persistRead, read]);
  const markOneRead = useCallback((id) => persistRead(notifications.markRead(read, id)), [persistRead, read]);
  const unread = useMemo(() => notifications.unreadCount(items, read), [items, read]);
  return { items, unread, markAllRead, markOneRead };
}
