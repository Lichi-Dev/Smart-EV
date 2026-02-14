"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import axios from "axios";
import AppHeader from "../components/AppHeader";
import LocationSearchInput from "../components/LocationSearchInput";

const TripMap = dynamic(() => import("../components/TripMap"), { ssr: false });

type OriginDest = { lat: number; lng: number; address: string };

type RouteOption = {
  id: number;
  distanceMeters: number;
  durationSeconds: number;
  bbox: [number, number, number, number] | null;
  coordinates: [number, number][];
};

type Station = {
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

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function HomePage() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [rangeKmInput, setRangeKmInput] = useState("5");
  const [origin, setOrigin] = useState<OriginDest | null>(null);
  const [dest, setDest] = useState<OriginDest | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanRoute = async () => {
    setError(null);
    setStations([]);
    setSelectedRoute(null);
    setOrigin(null);
    setDest(null);

    const src = source.trim();
    const dst = destination.trim();
    if (!src || !dst) {
      setError("Please enter source and destination.");
      return;
    }

    try {
      setLoading(true);
      const resp = await axios.post(`${backendUrl}/api/routes`, {
        source: src,
        destination: dst,
      });

      const data = resp.data as {
        routes: RouteOption[];
        origin: { address: string; lat: number; lng: number };
        destination: { address: string; lat: number; lng: number };
      };

      setOrigin({
        lat: data.origin.lat,
        lng: data.origin.lng,
        address: data.origin.address,
      });
      setDest({
        lat: data.destination.lat,
        lng: data.destination.lng,
        address: data.destination.address,
      });
      setRoutes(data.routes);
      if (data.routes.length > 0) {
        setSelectedRoute(data.routes[0]);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || "Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  const rangeKm = (() => {
    const n = parseInt(rangeKmInput, 10);
    return Number.isFinite(n) && n >= 1 && n <= 50 ? n : 5;
  })();

  const fetchStationsForRoute = async (
    routeList: RouteOption[],
    chosenRoute: RouteOption | null,
    bufferKm: number
  ) => {
    if (routeList.length === 0) return;

    const getBounds = (
      r: RouteOption
    ): [number, number, number, number] | null => {
      if (r.bbox && r.bbox.length === 4) return r.bbox;
      if (r.coordinates?.length) {
        const lngs = r.coordinates.map((c) => c[0]);
        const lats = r.coordinates.map((c) => c[1]);
        return [
          Math.min(...lngs),
          Math.min(...lats),
          Math.max(...lngs),
          Math.max(...lats),
        ];
      }
      return null;
    };

    const boundsList = routeList.map(getBounds).filter(Boolean) as [
      number,
      number,
      number,
      number
    ][];
    if (boundsList.length === 0) return;

    const [minLng, minLat, maxLng, maxLat] = boundsList.reduce(
      (acc, b) => [
        Math.min(acc[0], b[0]),
        Math.min(acc[1], b[1]),
        Math.max(acc[2], b[2]),
        Math.max(acc[3], b[3]),
      ],
      boundsList[0]
    );

    const coordinates =
      chosenRoute?.coordinates?.length &&
      chosenRoute.coordinates.every(
        (c) => Array.isArray(c) && c.length === 2
      )
        ? chosenRoute.coordinates
        : undefined;

    try {
      const resp = await axios.post(`${backendUrl}/api/stations/near-route`, {
        bufferKm,
        bounds: { minLat, maxLat, minLng, maxLng },
        ...(coordinates && { coordinates }),
      });
      setStations(resp.data.stations ?? []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || "Failed to fetch nearby stations");
    }
  };

  useEffect(() => {
    if (routes.length > 0) {
      fetchStationsForRoute(routes, selectedRoute, rangeKm);
    }
  }, [routes, selectedRoute, rangeKm]);

  const handleSaveTrip = async () => {
    if (!selectedRoute || !origin || !dest) return;
    try {
      await axios.post(`${backendUrl}/api/trips`, {
        origin: {
          address: origin.address,
          latitude: origin.lat,
          longitude: origin.lng,
        },
        destination: {
          address: dest.address,
          latitude: dest.lat,
          longitude: dest.lng,
        },
        routeProvider: "graphhopper",
        distanceMeters: selectedRoute.distanceMeters,
        durationSeconds: selectedRoute.durationSeconds,
        stops: stations.map((s) => ({
          type: "charging",
          station: s._id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      });
      alert("Trip saved!");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || "Failed to save trip");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Smart EV Trip Planner" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-slate-600">
          Plan your route and see charging stations along the way.
        </p>
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="space-y-6">
            <div className="card">
              <h2 className="section-title mb-4">Plan your trip</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">From</label>
                  <LocationSearchInput
                    value={source}
                    onChange={setSource}
                    placeholder="e.g. Connaught Place, Delhi"
                  />
                </div>
                <div>
                  <label className="label">To</label>
                  <LocationSearchInput
                    value={destination}
                    onChange={setDestination}
                    placeholder="e.g. India Gate, New Delhi"
                  />
                </div>
                <div>
                  <label className="label">Charging station range (km)</label>
                  <input
                    className="input-base"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 5"
                    value={rangeKmInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      if (v === "") setRangeKmInput("");
                      else {
                        const n = parseInt(v, 10);
                        if (n === 0) setRangeKmInput("");
                        else if (n <= 50) setRangeKmInput(String(n));
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-500">1–50 km. Using {rangeKm} km for stations.</p>
                </div>
                <button
                  onClick={handlePlanRoute}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "Plan route"
                  )}
                </button>
                {selectedRoute && (
                  <button onClick={handleSaveTrip} className="btn-secondary">
                    Save trip
                  </button>
                )}
                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="section-title mb-4">Route options</h3>
              {routes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Enter origin and destination, then plan a route.
                </p>
              ) : (
                <ul
                  className="space-y-2"
                  role="radiogroup"
                  aria-label="Route options"
                >
                  {routes.map((r) => {
                    const isSelected = selectedRoute?.id === r.id;
                    return (
                      <li key={r.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name="route-option"
                            value={r.id}
                            checked={isSelected}
                            onChange={() => setSelectedRoute(r)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm font-medium text-slate-800">
                            Route {r.id + 1} · {(r.distanceMeters / 1000).toFixed(1)} km
                          </span>
                          <span className="text-xs text-slate-500">
                            {Math.round(r.durationSeconds / 60)} min
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="section-title">Map & charging stations</h2>
            <div
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              style={{ height: 480 }}
            >
              <TripMap
                origin={origin}
                destination={dest}
                allRoutes={routes}
                selectedRouteId={selectedRoute?.id ?? null}
                stations={stations}
                className="absolute inset-0 h-full w-full"
              />
            </div>

            <div className="card">
              <h3 className="section-title mb-4">Suggested charging stations</h3>
              {stations.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No stations in range.{" "}
                  <Link href="/admin" className="link">
                    Add stations in Admin
                  </Link>{" "}
                  or increase the range above.
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {stations.map((s) => (
                    <li
                      key={s._id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="font-medium text-slate-800">{s.name}</p>
                      {typeof s.location === "string" && s.location && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {s.location}
                        </p>
                      )}
                      {[s.city, s.country_code].some(Boolean) && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[s.city, s.country_code].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <p className="mt-0.5 flex gap-2 text-xs text-slate-400">
                        {s.powerKw != null && <span>{s.powerKw} kW</span>}
                        {s.ports != null && <span>{s.ports} port(s)</span>}
                        {s.isFastCharging && <span>Fast</span>}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
