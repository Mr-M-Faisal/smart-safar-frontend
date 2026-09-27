"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

function timeLabel(value) {
  return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value)) : "Waiting for bus location";
}

export default function SharedTripViewer({ shareToken }) {
  const [trip, setTrip] = useState(null);
  const [state, setState] = useState(shareToken ? "loading" : "missing");
  const [message, setMessage] = useState(shareToken ? "" : "This shared trip link is missing its access token.");
  const [mapReady, setMapReady] = useState(false);
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!shareToken) return;
    try {
      const result = await apiRequest(`/safety/track/${encodeURIComponent(shareToken)}`);
      setTrip(result);
      setMessage("");
      setState("ready");
    } catch (error) {
      setMessage(error.message || "This shared trip could not be loaded.");
      setState(error.status === 410 ? "ended" : error.status === 404 ? "missing" : "error");
    }
  }, [shareToken]);

  useEffect(() => {
    if (!shareToken) return undefined;
    setState("loading");
    setMessage("");
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh, shareToken]);

  useEffect(() => {
    if (state !== "ready" || !mapContainer.current) return undefined;
    let cancelled = false;
    setMapReady(false);
    import("leaflet").then((module) => {
      if (cancelled || !mapContainer.current) return;
      const L = module.default || module;
      leafletRef.current = L;
      mapRef.current = L.map(mapContainer.current, { zoomControl: true, scrollWheelZoom: false }).setView([31.418, 73.079], 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      }).addTo(mapRef.current);
      setMapReady(true);
    }).catch(() => {});
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      markerRef.current = null;
    };
  }, [state]);

  const location = trip?.bus?.currentLocation;
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !location || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) return;
    const coordinates = [Number(location.latitude), Number(location.longitude)];
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(coordinates, { radius: 10, color: "#fff", weight: 3, fillColor: "#536bb7", fillOpacity: 1 }).addTo(map);
    } else markerRef.current.setLatLng(coordinates);
    markerRef.current.bindTooltip(trip.bus?.busNumber || "Shared bus", { direction: "top" });
    map.setView(coordinates, Math.max(map.getZoom(), 14), { animate: true });
  }, [mapReady, location?.latitude, location?.longitude, trip?.bus?.busNumber]);

  const coordinatesValid = location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude));
  const mapLink = coordinatesValid ? `https://www.google.com/maps?q=${encodeURIComponent(`${location.latitude},${location.longitude}`)}` : "";

  return (
    <main className="min-h-[70vh] bg-[#f4f5fb] px-4 py-8 text-[#25304f] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#26386e] via-[#354b8d] to-[#4560a8] p-6 text-white shadow-[0_18px_45px_rgba(47,66,126,.18)] sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c7d2ff]">Private trip sharing</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Shared bus journey</h1>
          <p className="mt-2 text-sm leading-6 text-white/75">This link shows the bus location shared by a Smart Safar passenger. It refreshes while this page is open.</p>
        </section>

        {state === "loading" && <p role="status" className="mt-5 rounded-2xl bg-white p-5 text-sm text-[#74809a] shadow-sm">Loading shared trip…</p>}
        {["ended", "missing", "error"].includes(state) && <section role={state === "error" ? "alert" : "status"} className="mt-5 rounded-2xl border border-white bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-[#293553]">{state === "ended" ? "Trip sharing has ended" : state === "missing" ? "This link is unavailable" : "Could not load this trip"}</h2><p className="mt-2 text-sm leading-6 text-[#74809a]">{message}</p>{state === "error" && <button onClick={refresh} className="mt-4 rounded-xl bg-[#536bb7] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#43599f]">Try again</button>}</section>}

        {state === "ready" && <>
          <section className="mt-5 grid gap-3 rounded-2xl border border-white bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#8992a8]">Passenger</p><p className="mt-1 text-sm font-semibold text-[#34405d]">{trip.passenger || "Smart Safar passenger"}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#8992a8]">Bus and route</p><p className="mt-1 text-sm font-semibold text-[#34405d]">{trip.bus?.busNumber || "Bus"} · {trip.bus?.route?.routeName || "Route details unavailable"}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#8992a8]">Trip started</p><p className="mt-1 text-xs text-[#596681]">{timeLabel(trip.startedAt)}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#8992a8]">Bus location</p><p className="mt-1 text-xs text-[#596681]">{coordinatesValid ? `Updated ${timeLabel(trip.bus?.lastLocationUpdate)}` : "Waiting for the driver to share a GPS location"}</p></div>
          </section>
          <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-white bg-white p-2 shadow-[0_14px_38px_rgba(53,67,112,.08)]">
            <div ref={mapContainer} className="h-[320px] w-full rounded-[1.35rem] bg-[#e6e9f4] sm:h-[420px]" role="application" aria-label="Map showing the shared bus location" />
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"><p className="text-[10px] text-[#8992a8]">Location refreshes every 15 seconds while this page is active.</p>{mapLink && <a href={mapLink} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-lg bg-[#536bb7] px-3 text-[10px] font-semibold text-white hover:bg-[#43599f]">Open in Maps ↗</a>}</div>
          </section>
        </>}
        <p className="mt-5 text-center text-[10px] leading-5 text-[#8992a8]">Only share this private link with people you trust. The passenger can end sharing at any time.</p>
      </div>
    </main>
  );
}
