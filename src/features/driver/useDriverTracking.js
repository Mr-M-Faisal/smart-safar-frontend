"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

const MIN_SEND_INTERVAL_MS = 5000;
const MAX_SEND_INTERVAL_MS = 15000;
const MIN_MOVEMENT_METERS = 15;
const MAX_ACCURACY_METERS = 100;

function distanceMeters(left, right) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const lat1 = radians(left.latitude);
  const lat2 = radians(right.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = radians(right.longitude - left.longitude);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export default function useDriverTracking({ busId, token, enabled }) {
  const [status, setStatus] = useState("Searching");
  const [lastSentAt, setLastSentAt] = useState(null);
  const [lastAccuracy, setLastAccuracy] = useState(null);
  const [clock, setClock] = useState(() => Date.now());
  const [errorMessage, setErrorMessage] = useState("");
  const watchId = useRef(null);
  const wakeLock = useRef(null);
  const lastSentPosition = useRef(null);
  const pendingReading = useRef(null);
  const sending = useRef(false);

  const sendPending = useCallback(async () => {
    if (!enabled || !token || !busId || !navigator.onLine || !pendingReading.current || sending.current) return;
    const reading = pendingReading.current;
    pendingReading.current = null;
    sending.current = true;
    try {
      await apiRequest(`/buses/${encodeURIComponent(busId)}/location`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          latitude: reading.latitude,
          longitude: reading.longitude,
          speed: reading.speedMetersPerSecond == null ? undefined : reading.speedMetersPerSecond * 3.6,
          timestamp: new Date(reading.timestamp).toISOString(),
        }),
      });
      lastSentPosition.current = reading;
      setLastSentAt(Date.now());
      setStatus(reading.accuracy <= 35 ? "Good" : "Weak");
      setErrorMessage("");
    } catch (error) {
      if (error.status === 0 || !navigator.onLine) {
        pendingReading.current = reading;
        setStatus("Offline");
      } else if (error.code !== "STALE_LOCATION_UPDATE") {
        setErrorMessage(error.message || "The GPS update could not be sent.");
      }
    } finally {
      sending.current = false;
      if (pendingReading.current && navigator.onLine) void sendPending();
    }
  }, [busId, enabled, token]);

  useEffect(() => {
    if (!enabled || !token || !busId) {
      setStatus("Searching");
      pendingReading.current = null;
      lastSentPosition.current = null;
      if (watchId.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      if (wakeLock.current) void wakeLock.current.release().catch(() => {});
      wakeLock.current = null;
      return undefined;
    }

    if (!navigator.geolocation?.watchPosition) {
      setStatus("Weak");
      setErrorMessage("Location services are not available in this browser.");
      return undefined;
    }

    let active = true;
    setStatus(navigator.onLine ? "Searching" : "Offline");
    setErrorMessage("");
    const requestWakeLock = async () => {
      if (!active || document.visibilityState !== "visible" || !navigator.wakeLock?.request || (wakeLock.current && !wakeLock.current.released)) return;
      try { wakeLock.current = await navigator.wakeLock.request("screen"); }
      catch (_error) { wakeLock.current = null; }
    };
    const onVisibilityChange = () => { if (document.visibilityState === "visible") void requestWakeLock(); };
    const onOnline = () => { if (pendingReading.current) void sendPending(); else setStatus("Searching"); };
    const onOffline = () => setStatus("Offline");
    const onPosition = (position) => {
      if (!active) return;
      const coords = position.coords;
      const accuracy = Number(coords.accuracy);
      setLastAccuracy(Number.isFinite(accuracy) ? accuracy : null);
      if (!Number.isFinite(accuracy) || accuracy > MAX_ACCURACY_METERS) {
        setStatus("Weak");
        setErrorMessage("Move to an open area for a clearer GPS signal.");
        return;
      }
      setErrorMessage("");
      const reading = {
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
        accuracy,
        speedMetersPerSecond: Number.isFinite(coords.speed) && coords.speed >= 0 ? coords.speed : null,
        timestamp: Number(position.timestamp) || Date.now(),
      };
      const previous = lastSentPosition.current;
      const elapsed = previous ? reading.timestamp - previous.timestamp : MAX_SEND_INTERVAL_MS;
      const moved = previous ? distanceMeters(previous, reading) : MIN_MOVEMENT_METERS;
      if (elapsed < MIN_SEND_INTERVAL_MS || (moved < MIN_MOVEMENT_METERS && elapsed < MAX_SEND_INTERVAL_MS)) {
        setStatus(accuracy <= 35 ? "Good" : "Weak");
        return;
      }
      pendingReading.current = reading;
      if (!navigator.onLine) setStatus("Offline");
      else void sendPending();
    };
    const onPositionError = (error) => {
      if (!active) return;
      if (error.code === 1) {
        setStatus("Permission denied");
        setErrorMessage("Allow location access in your browser settings, then restart your shift tracking.");
      } else {
        setStatus(navigator.onLine ? "Searching" : "Offline");
        setErrorMessage(error.code === 2 ? "Your current location could not be determined. Move to an open area." : "GPS is taking longer than expected. Keep location services enabled.");
      }
    };

    watchId.current = navigator.geolocation.watchPosition(onPosition, onPositionError, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    void requestWakeLock();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      active = false;
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (wakeLock.current) void wakeLock.current.release().catch(() => {});
      wakeLock.current = null;
      pendingReading.current = null;
    };
  }, [busId, enabled, sendPending, token]);

  useEffect(() => {
    if (!lastSentAt) return undefined;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lastSentAt]);

  return { status, lastSentAt, lastSentSeconds: lastSentAt ? Math.max(0, Math.floor((clock - lastSentAt) / 1000)) : null, lastAccuracy, errorMessage };
}
