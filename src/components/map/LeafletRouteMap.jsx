"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FAISALABAD_CENTER } from "@/data/faisalabad-demo";

const routeColors = ["#20bba5", "#7185c6", "#e49353", "#438fbb", "#b16baa", "#629a68"];

function safeTooltip(text) {
  const element = document.createElement("span");
  element.textContent = String(text || "");
  return element;
}

function isCoordinate(lat, lng) {
  return lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

export default function LeafletRouteMap({
  routeSegments = [],
  buses = [],
  selectedRouteId = null,
  selectedBusId = null,
  onSelectRoute,
  onSelectBus,
  mapController,
  className = "",
  ariaLabel = "Map showing transit routes and stops",
}) {
  const containerRef = useRef(null);
  const leafletRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const routeSelectRef = useRef(onSelectRoute);
  const busSelectRef = useRef(onSelectBus);
  const [mapReady, setMapReady] = useState(false);
  routeSelectRef.current = onSelectRoute;
  busSelectRef.current = onSelectBus;

  useEffect(() => {
    let cancelled = false;
    let resizeObserver;
    let resizeHandler;
    import("leaflet").then((module) => {
      if (cancelled || !containerRef.current) return;
      const L = module.default || module;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false, preferCanvas: true, scrollWheelZoom: false })
        .setView(FAISALABAD_CENTER, 12);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      if (mapController) mapController.current = map;
      setMapReady(true);

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        resizeObserver.observe(containerRef.current);
      } else {
        resizeHandler = () => map.invalidateSize({ pan: false });
        window.addEventListener("resize", resizeHandler);
      }
      window.setTimeout(() => map.invalidateSize({ pan: false }), 80);
    }).catch(() => {});

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
      if (mapController) mapController.current = null;
      setMapReady(false);
    };
  }, [mapController]);

  const pathSignature = useMemo(() => routeSegments.map((segment) => `${segment.routeId || segment._id}:${(segment.stops || []).map((stop) => `${stop.stopName}:${stop.latitude}:${stop.longitude}`).join(";")}`).join("|"), [routeSegments]);
  const lastPathSignature = useRef("");

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!mapReady || !L || !map || !layer) return;
    layer.clearLayers();
    const allPoints = [];

    routeSegments.forEach((segment, segmentIndex) => {
      const routeId = segment.routeId || segment._id;
      const points = (segment.stops || []).filter((stop) => isCoordinate(stop.latitude, stop.longitude))
        .map((stop) => [Number(stop.latitude), Number(stop.longitude)]);
      allPoints.push(...points);
      const isSelected = !selectedRouteId || String(routeId) === String(selectedRouteId);
      const color = routeColors[segmentIndex % routeColors.length];

      if (points.length > 1) {
        const line = L.polyline(points, {
          color,
          weight: isSelected ? 5 : 3,
          opacity: isSelected ? 0.96 : 0.55,
          lineCap: "round",
          lineJoin: "round",
          ...(isSelected ? {} : { dashArray: "7 8" }),
        }).addTo(layer);
        if (routeSelectRef.current) {
          line.on("click", () => routeSelectRef.current(routeId));
          line.bindTooltip(safeTooltip(segment.routeName || "Transit route"), { sticky: true });
        }
      }

      (segment.stops || []).forEach((stop, stopIndex) => {
        if (!isCoordinate(stop.latitude, stop.longitude)) return;
        L.circleMarker([Number(stop.latitude), Number(stop.longitude)], {
          radius: isSelected ? (stopIndex === 0 || stopIndex === segment.stops.length - 1 ? 7 : 5) : 4,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.98 : 0.74,
        }).bindTooltip(safeTooltip(stop.stopName), { direction: "top", offset: [0, -5] }).addTo(layer);
      });
    });

    buses.forEach((bus) => {
      if (!isCoordinate(bus.currentLocation?.latitude, bus.currentLocation?.longitude)) return;
      const isSelected = String(bus._id) === String(selectedBusId);
      const stateClass = bus.status === "maintenance" ? " is-maintenance" : bus.status === "idle" ? " is-idle" : "";
      const icon = L.divIcon({
        className: "ss-leaflet-marker",
        html: `<span class="ss-bus-pin${isSelected ? " is-selected" : ""}${stateClass}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 16.5h14V7.8A1.8 1.8 0 0 0 17.2 6H6.8A1.8 1.8 0 0 0 5 7.8v8.7ZM5 12h14M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="17.5" r="1.6" fill="currentColor"/><circle cx="16" cy="17.5" r="1.6" fill="currentColor"/></svg></span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });
      const marker = L.marker([Number(bus.currentLocation.latitude), Number(bus.currentLocation.longitude)], {
        icon,
        keyboard: true,
        title: bus.busNumber || "Transit bus",
      }).addTo(layer);
      marker.bindTooltip(safeTooltip(bus.busNumber || "Transit bus"), { direction: "top", offset: [0, -17] });
      if (busSelectRef.current) marker.on("click", () => busSelectRef.current(bus._id));
      allPoints.push([Number(bus.currentLocation.latitude), Number(bus.currentLocation.longitude)]);
    });

    const selectionSignature = `${pathSignature}|${selectedRouteId || "all"}`;
    if (selectionSignature !== lastPathSignature.current) {
      lastPathSignature.current = selectionSignature;
      if (allPoints.length > 1) map.fitBounds(L.latLngBounds(allPoints), { padding: [24, 24], maxZoom: routeSegments.length > 1 ? 13 : 15 });
      else map.setView(FAISALABAD_CENTER, 12);
    }
  }, [mapReady, pathSignature, routeSegments, buses, selectedRouteId, selectedBusId]);

  return <div ref={containerRef} className={`leaflet-route-map h-full w-full rounded-[inherit] bg-[#e6e9f4] ${className}`} role="application" aria-label={ariaLabel} />;
}
