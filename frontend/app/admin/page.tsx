"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AppHeader from "../../components/AppHeader";

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
  isActive?: boolean;
};

type Trip = {
  _id: string;
  origin: { address: string };
  destination: { address: string };
  createdAt: string;
};

type TrafficRow = { city?: string; country?: string; count: number };

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const STATIONS_PAGE_SIZE = 20;

export default function AdminPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsPage, setStationsPage] = useState(1);
  const [stationsTotal, setStationsTotal] = useState(0);
  const [stationsTotalPages, setStationsTotalPages] = useState(0);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsRefresh, setStationsRefresh] = useState(0);
  const [stationSearch, setStationSearch] = useState("");
  const [stationSearchQuery, setStationSearchQuery] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);

  const [newStation, setNewStation] = useState({
    name: "",
    location: "",
    city: "",
    country_code: "",
    latitude: "",
    longitude: "",
    ports: "",
    powerKw: "",
    isFastCharging: false,
  });
  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [tripsRes, trafficRes] = await Promise.all([
        axios.get(`${backendUrl}/api/admin/trips`),
        axios.get(`${backendUrl}/api/admin/traffic`),
      ]);
      setTrips(tripsRes.data.trips);
      setTraffic(trafficRes.data.byCity);
    };
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setStationSearchQuery(stationSearch), 300);
    return () => clearTimeout(t);
  }, [stationSearch]);

  useEffect(() => {
    const load = async () => {
      setStationsLoading(true);
      try {
        const params: { page: number; limit: number; q?: string } = {
          page: stationsPage,
          limit: STATIONS_PAGE_SIZE,
        };
        if (stationSearchQuery) params.q = stationSearchQuery;
        const res = await axios.get(`${backendUrl}/api/admin/stations`, { params });
        setStations(res.data.stations);
        setStationsTotal(res.data.total);
        setStationsTotalPages(res.data.totalPages);
      } finally {
        setStationsLoading(false);
      }
    };
    load();
  }, [stationsPage, stationsRefresh, stationSearchQuery]);

  const onStationSearchChange = (value: string) => {
    setStationSearch(value);
    setStationsPage(1);
  };

  const handleAddStation = async () => {
    if (!newStation.name || !newStation.latitude || !newStation.longitude)
      return;
    const payload: Record<string, unknown> = {
      name: newStation.name,
      latitude: Number(newStation.latitude),
      longitude: Number(newStation.longitude),
      isFastCharging: newStation.isFastCharging,
    };
    if (newStation.location.trim()) payload.location = newStation.location.trim();
    if (newStation.city.trim()) payload.city = newStation.city.trim();
    if (newStation.country_code.trim()) payload.country_code = newStation.country_code.trim();
    if (newStation.ports !== "") payload.ports = Number(newStation.ports);
    if (newStation.powerKw !== "") payload.powerKw = Number(newStation.powerKw);
    await axios.post(`${backendUrl}/api/admin/stations`, payload);
    setStationsPage(1);
    setStationsRefresh((r) => r + 1);
    setNewStation({
      name: "",
      location: "",
      city: "",
      country_code: "",
      latitude: "",
      longitude: "",
      ports: "",
      powerKw: "",
      isFastCharging: false,
    });
  };

  const handleGetAddressFromCoords = async () => {
    const lat = newStation.latitude.trim();
    const lng = newStation.longitude.trim();
    if (!lat || !lng) {
      setReverseError("Enter latitude and longitude first.");
      return;
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setReverseError("Enter valid numbers for lat and lng.");
      return;
    }
    setReverseError(null);
    setReverseLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/geocode/reverse`, {
        params: { lat: latNum, lng: lngNum },
      });
      setNewStation((s) => ({
        ...s,
        name: res.data.address || s.name,
        location: res.data.address || s.location,
        city: res.data.city ?? s.city,
      }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setReverseError(e?.response?.data?.error || "Could not get address.");
    } finally {
      setReverseLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Admin" showNav={false} />
      <main className="w-full">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="mb-6 text-slate-600">
            Manage stations, view trips, and traffic.
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
          <div className="card">
            <h2 className="section-title mb-4">Add EV station</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  className="input-base"
                  placeholder="Station name"
                  value={newStation.name}
                  onChange={(e) =>
                    setNewStation((s) => ({ ...s, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Location / address</label>
                <input
                  className="input-base"
                  placeholder="Full address or place"
                  value={newStation.location}
                  onChange={(e) =>
                    setNewStation((s) => ({ ...s, location: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input
                    className="input-base"
                    placeholder="City"
                    value={newStation.city}
                    onChange={(e) =>
                      setNewStation((s) => ({ ...s, city: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Country code</label>
                  <input
                    className="input-base"
                    placeholder="e.g. IN, US"
                    value={newStation.country_code}
                    onChange={(e) =>
                      setNewStation((s) => ({ ...s, country_code: e.target.value.toUpperCase() }))
                    }
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude</label>
                  <input
                    className="input-base"
                    placeholder="Lat"
                    value={newStation.latitude}
                    onChange={(e) =>
                      setNewStation((s) => ({ ...s, latitude: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input
                    className="input-base"
                    placeholder="Lng"
                    value={newStation.longitude}
                    onChange={(e) =>
                      setNewStation((s) => ({ ...s, longitude: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ports</label>
                  <input
                    className="input-base"
                    type="number"
                    min={0}
                    placeholder="Number of connectors"
                    value={newStation.ports}
                    onChange={(e) =>
                      setNewStation((s) => ({ ...s, ports: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Power (kW)</label>
                  <input
                    className="input-base"
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="kW"
                    value={newStation.powerKw}
                    onChange={(e) =>
                      setNewStation((s) => ({ ...s, powerKw: e.target.value }))
                    }
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={newStation.isFastCharging}
                  onChange={(e) =>
                    setNewStation((s) => ({ ...s, isFastCharging: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Fast charging</span>
              </label>
              <button
                type="button"
                onClick={handleGetAddressFromCoords}
                disabled={reverseLoading || !newStation.latitude.trim() || !newStation.longitude.trim()}
                className="btn-secondary"
              >
                {reverseLoading ? "Looking up…" : "Get address from coordinates"}
              </button>
              {reverseError && (
                <p className="text-sm text-red-600">{reverseError}</p>
              )}
              <button onClick={handleAddStation} className="btn-primary">
                Save station
              </button>
            </div>
          </div>

          <div className="card flex h-full min-h-0 flex-col">
            <h2 className="section-title mb-4 shrink-0">Trip history</h2>
            <div className="min-h-0 flex-1 space-y-2 overflow-auto">
              {trips.map((t) => (
                <div
                  key={t._id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-slate-800">
                    {t.origin.address} → {t.destination.address}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">Traffic by city</h2>
            {traffic.length === 0 ? (
              <p className="text-sm text-slate-500">No traffic data yet.</p>
            ) : (
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-3 font-medium">City</th>
                      <th className="pb-2 pr-3 font-medium">Country</th>
                      <th className="pb-2 text-right font-medium">Hits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traffic.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 text-slate-700 last:border-0"
                      >
                        <td className="py-2 pr-3">{row.city || "—"}</td>
                        <td className="py-2 pr-3">{row.country || "—"}</td>
                        <td className="py-2 text-right tabular-nums">
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="section-title mb-4">All stations</h2>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              placeholder="Search by name, location or city…"
              value={stationSearch}
              onChange={(e) => onStationSearchChange(e.target.value)}
              className="input-base max-w-md"
            />
            <p className="text-sm text-slate-500">
              {stationsTotal.toLocaleString()} total
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Location</th>
                  <th className="py-2 pr-4 font-medium">City</th>
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 font-medium">Ports</th>
                  <th className="py-2 pr-4 font-medium">Power (kW)</th>
                  <th className="py-2 pr-4 font-medium">Fast</th>
                  <th className="py-2 font-medium">Lat, Lng</th>
                </tr>
              </thead>
              <tbody>
                {stationsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  stations.map((s) => (
                    <tr
                      key={s._id}
                      className="border-b border-slate-100 text-slate-700 last:border-0 hover:bg-slate-50"
                    >
                      <td className="max-w-[200px] truncate py-2 pr-4 font-medium" title={s.name}>
                        {s.name}
                      </td>
                      <td className="max-w-[200px] truncate py-2 pr-4 text-slate-600" title={typeof s.location === "string" ? s.location : ""}>
                        {typeof s.location === "string" && s.location ? s.location : "—"}
                      </td>
                      <td className="py-2 pr-4">{s.city || "—"}</td>
                      <td className="py-2 pr-4">{s.country_code || "—"}</td>
                      <td className="py-2 pr-4">{s.ports ?? "—"}</td>
                      <td className="py-2 pr-4">{s.powerKw ?? "—"}</td>
                      <td className="py-2 pr-4">{s.isFastCharging ? "Yes" : "—"}</td>
                      <td className="whitespace-nowrap py-2 text-slate-500">
                        {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {stationsTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStationsPage((p) => Math.max(1, p - 1))}
                disabled={stationsPage <= 1 || stationsLoading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {stationsPage} of {stationsTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setStationsPage((p) => Math.min(stationsTotalPages, p + 1))}
                disabled={stationsPage >= stationsTotalPages || stationsLoading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}
