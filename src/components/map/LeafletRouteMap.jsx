"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { FAISALABAD_CENTER } from "@/data/mapConfig";
import { SERVICE_AREA_BOUNDS, normalizeServiceCoordinate } from "@/data/serviceArea";

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
  onPickCoordinate,
  onStopDrag,
  draggableStops = false,
}) {
  const containerRef = useRef(null);
  const leafletRef = useRef(null);
  const mapRef = useRef(null);
  const segmentLayerRef = useRef(null);
  const busLayerRef = useRef(null);
  const routeSelectRef = useRef(onSelectRoute);
  const busSelectRef = useRef(onSelectBus);
  const pickCoordinateRef = useRef(onPickCoordinate);
  const stopDragRef = useRef(onStopDrag);
  const [mapReady, setMapReady] = useState(false);
  routeSelectRef.current = onSelectRoute;
  busSelectRef.current = onSelectBus;
  pickCoordinateRef.current = onPickCoordinate;
  stopDragRef.current = onStopDrag;

  useEffect(() => {
    let cancelled = false;
    let resizeObserver;
    let resizeHandler;
    import("leaflet").then((module) => {
      if (cancelled || !containerRef.current) return;
      const L = module.default || module;
      leafletRef.current = L;
      const touchDevice = window.matchMedia?.("(pointer: coarse)").matches || false;
      const map = L.map(containerRef.current, { zoomControl: false, preferCanvas: true, scrollWheelZoom: false, dragging: !touchDevice, touchZoom: !touchDevice, minZoom: 9, maxBounds: L.latLngBounds(SERVICE_AREA_BOUNDS).pad(0.12), maxBoundsViscosity: 1 })
        .setView(FAISALABAD_CENTER, 12);
      map.on("moveend", () => {
        const center = map.getCenter();
        containerRef.current?.setAttribute("data-center-lat", String(center.lat));
        containerRef.current?.setAttribute("data-center-lng", String(center.lng));
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      }).addTo(map);
      mapRef.current = map;
      segmentLayerRef.current = L.layerGroup().addTo(map);
      busLayerRef.current = L.layerGroup().addTo(map);
      if (mapController) mapController.current = map;
      setMapReady(true);
      window.addEventListener("smart-safar:map-layout-changed", onLayoutChange);

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        resizeObserver.observe(containerRef.current);
      } else {
        resizeHandler = () => map.invalidateSize({ pan: false });
        window.addEventListener("resize", resizeHandler);
      }
      window.setTimeout(() => map.invalidateSize({ pan: false }), 80);
      map.on("click", (event) => {
        if (typeof pickCoordinateRef.current === "function") pickCoordinateRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("smart-safar:map-layout-changed", onLayoutChange);
      mapRef.current?.remove();
      mapRef.current = null;
      segmentLayerRef.current = null;
      busLayerRef.current = null;
      leafletRef.current = null;
      if (mapController) mapController.current = null;
      setMapReady(false);
    };
  }, [mapController]);

  function onLayoutChange() { mapRef.current?.invalidateSize({ pan: false }); }

  const pathSignature = useMemo(() => routeSegments.map((segment) => `${segment.routeId || segment._id}:${(segment.stops || []).map((stop, index) => `${stop._id || stop.stopName || index}:${stop.stopOrder ?? index + 1}:${stop.latitude}:${stop.longitude}`).join(";")}`).join("|"), [routeSegments]);
  const lastPathSignature = useRef("");

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const segmentLayer = segmentLayerRef.current;
    if (!mapReady || !L || !map || !segmentLayer) return;
    segmentLayer.clearLayers();
    const allPoints = [];

    routeSegments.forEach((segment, segmentIndex) => {
      const routeId = segment.routeId || segment._id;
      const stops = (segment.stops || []).slice().sort((left, right) => (Number(left.stopOrder) || 0) - (Number(right.stopOrder) || 0));
      const locatedStops = stops.map((stop, index) => ({ stop, index, point: normalizeServiceCoordinate(stop.latitude, stop.longitude, { label: "stop", id: stop._id || stop.stopName }) })).filter((entry) => entry.point);
      const points = locatedStops.map((entry) => entry.point);
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
        }).addTo(segmentLayer);
        if (routeSelectRef.current) {
          line.on("click", () => routeSelectRef.current(routeId));
          line.bindTooltip(safeTooltip(segment.routeName || "Transit route"), { sticky: true });
        }
      }

      locatedStops.forEach(({ stop, index }, locatedIndex) => {
        const point = locatedStops[locatedIndex].point;
        const markerColor = index === 0 ? "#18846f" : index === stops.length - 1 ? "#e49353" : color;
        const marker = L.marker(point, {
          icon: L.divIcon({ className: "ss-route-stop-marker", html: `<span style="display:grid;place-items:center;width:36px;height:36px;border:3px solid #fff;border-radius:50%;background:${markerColor};color:#fff;font:700 13px/1 sans-serif;box-shadow:0 2px 8px #25304f55">${index + 1}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] }),
          draggable: Boolean(draggableStops && (stop._id || stop.draftId) && stopDragRef.current),
          keyboard: true,
          title: stop.stopName || `Stop ${index + 1}`,
        }).bindTooltip(safeTooltip(stop.stopName || `Stop ${index + 1}`), { direction: "top", offset: [0, -8] }).addTo(segmentLayer);
        if (marker.options.draggable) marker.on("dragend", (event) => {
          const latlng = event.target.getLatLng();
          stopDragRef.current?.(stop._id || stop.draftId, { latitude: latlng.lat, longitude: latlng.lng });
        });
      });
    });

    const selectionSignature = `${pathSignature}|${selectedRouteId || "all"}`;
    if (selectionSignature !== lastPathSignature.current) {
      lastPathSignature.current = selectionSignature;
      if (allPoints.length > 1) map.fitBounds(L.latLngBounds(allPoints), { padding: [24, 24], maxZoom: routeSegments.length > 1 ? 13 : 15 });
      else if (allPoints.length === 1) map.setView(allPoints[0], 15);
      else map.setView(FAISALABAD_CENTER, 12);
    }
  }, [mapReady, pathSignature, routeSegments, selectedRouteId]);

  useEffect(() => {
    const L = leafletRef.current;
    const busLayer = busLayerRef.current;
    if (!mapReady || !L || !busLayer) return;
    busLayer.clearLayers();

    buses.forEach((bus) => {
      const point = normalizeServiceCoordinate(bus.currentLocation?.latitude, bus.currentLocation?.longitude, { label: "bus", id: bus._id || bus.busNumber });
      if (!point) return;
      const isSelected = String(bus._id) === String(selectedBusId);
      const stateClass = bus.status === "maintenance" ? " is-maintenance" : bus.status === "idle" ? " is-idle" : "";
      const icon = L.divIcon({
        className: "ss-leaflet-marker",
        html: `<span class="ss-bus-pin${isSelected ? " is-selected" : ""}${stateClass}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 16.5h14V7.8A1.8 1.8 0 0 0 17.2 6H6.8A1.8 1.8 0 0 0 5 7.8v8.7ZM5 12h14M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="17.5" r="1.6" fill="currentColor"/><circle cx="16" cy="17.5" r="1.6" fill="currentColor"/></svg></span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });
      const marker = L.marker(point, {
        icon,
        keyboard: true,
        title: bus.busNumber || "Transit bus",
      }).addTo(busLayer);
      marker.bindTooltip(safeTooltip(bus.busNumber || "Transit bus"), { direction: "top", offset: [0, -17] });
      if (busSelectRef.current) marker.on("click", () => busSelectRef.current(bus._id));
    });
  }, [mapReady, buses, selectedBusId]);

  const totalStops = routeSegments.reduce((count, segment) => count + (segment.stops?.length || 0), 0);
  const missingStops = routeSegments.reduce((count, segment) => count + (segment.stops || []).filter((stop) => !normalizeServiceCoordinate(stop.latitude, stop.longitude, { label: "stop" })).length, 0);
  return <div className={`relative h-full w-full overflow-hidden rounded-[inherit] bg-[#e6e9f4] ${className}`}>
    <div ref={containerRef} className="leaflet-route-map h-full w-full" role="application" aria-label={ariaLabel} />
    {totalStops === 0 && <p className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-medium text-[#596681] shadow-sm">{onPickCoordinate ? "No stops added yet. Click the map to place one." : "No route stops to display."}</p>}
    {missingStops > 0 && <p role="status" className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm">{missingStops} {missingStops === 1 ? "stop has" : "stops have"} no location</p>}
  </div>;
}
