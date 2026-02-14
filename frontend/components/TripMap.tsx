"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapOriginDest = { lat: number; lng: number; address?: string };
export type RouteWithCoords = {
  id: number;
  coordinates: [number, number][];
  bbox?: [number, number, number, number] | null;
};
export type Station = {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  location?: string;
  city?: string;
  country_code?: string;
  ports?: number;
  powerKw?: number;
  isFastCharging?: boolean;
};

type TripMapProps = {
  origin: MapOriginDest | null;
  destination: MapOriginDest | null;
  allRoutes: RouteWithCoords[];
  selectedRouteId: number | null;
  stations: Station[];
  className?: string;
};

const createIcon = (color: string, size = 24) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const createChargingIcon = () =>
  L.divIcon({
    className: "custom-marker charging-marker",
    html: `<div style="background:#eab308;width:36px;height:36px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;font-size:18px;color:#1c1917;">⚡</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

export default function TripMap({
  origin,
  destination,
  allRoutes,
  selectedRouteId,
  stations,
  className = "",
}: TripMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const map = L.map(el).setView([20.5937, 78.9629], 4); // India default
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;

    const t = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layers: L.Layer[] = [];

    if (origin) {
      const m = L.marker([origin.lat, origin.lng], {
        icon: createIcon("#22c55e"),
      }).addTo(map);
      if (origin.address) m.bindPopup(`<b>Origin</b><br/>${origin.address}`);
      layers.push(m);
    }
    if (destination) {
      const m = L.marker([destination.lat, destination.lng], {
        icon: createIcon("#ef4444"),
      }).addTo(map);
      if (destination.address)
        m.bindPopup(`<b>Destination</b><br/>${destination.address}`);
      layers.push(m);
    }

    allRoutes.forEach((route) => {
      if (!route.coordinates?.length) return;
      const latLngs: L.LatLngExpression[] = route.coordinates.map(
        ([lng, lat]) => [lat, lng] as L.LatLngExpression
      );
      const isSelected = route.id === selectedRouteId;
      const polyline = L.polyline(latLngs, {
        color: isSelected ? "#0ea5e9" : "#64748b",
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.6,
      }).addTo(map);
      layers.push(polyline);
    });

    const validStations = stations
      .map((s) => ({
        ...s,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
      }))
      .filter(
        (s) =>
          !Number.isNaN(s.lat) &&
          !Number.isNaN(s.lng) &&
          s.lat >= -90 &&
          s.lat <= 90 &&
          s.lng >= -180 &&
          s.lng <= 180
      );
    validStations.forEach((s) => {
      const m = L.marker([s.lat, s.lng], {
        icon: createChargingIcon(),
        zIndexOffset: 500,
      }).addTo(map);
      m.bindPopup(`<b>⚡ ${s.name}</b>${s.location ? `<br/>${s.location}` : ""}`);
      layers.push(m);
    });

    if (origin && destination) {
      const points: L.LatLngExpression[] = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ];
      allRoutes.forEach((route) => {
        route.coordinates?.forEach(([lng, lat]) => points.push([lat, lng]));
      });
      validStations.forEach((s) => points.push([s.lat, s.lng]));
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [origin, destination, allRoutes, selectedRouteId, stations]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: "100%", height: "100%", minHeight: 400 }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 rounded-xl"
        style={{ width: "100%", height: "100%", minHeight: 400 }}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Origin
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Destination
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-amber-500">⚡</span>
          Charging station
        </div>
      </div>
    </div>
  );
}
