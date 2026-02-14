"use client";

import { useEffect, useState } from "react";
import AppHeader from "../../components/AppHeader";
import axios from "axios";

type Stop = {
  type: string;
  name?: string;
  latitude: number;
  longitude: number;
};

type Trip = {
  _id: string;
  origin: { address: string };
  destination: { address: string };
  distanceMeters: number;
  durationSeconds: number;
  createdAt: string;
  stops?: Stop[];
};

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function HistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const resp = await axios.get(`${backendUrl}/api/trips/history`);
      setTrips(resp.data.trips);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Trip History" showNav={false} />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-slate-600">Your saved trips.</p>
        <div className="card">
          {trips.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No trips saved yet. Plan a route and click &quot;Save trip&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {trips.map((t) => {
                const isExpanded = expandedId === t._id;
                const chargingStops = (t.stops || []).filter(
                  (s) => s.type === "charging"
                );
                return (
                  <li key={t._id} className="py-2 first:pt-0">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : t._id)
                      }
                      className="flex w-full flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between rounded-lg px-2 py-3 -mx-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800">
                          {t.origin.address} → {t.destination.address}
                        </p>
                        <p className="text-sm text-slate-500">
                          {(t.distanceMeters / 1000).toFixed(1)} km ·{" "}
                          {Math.round(t.durationSeconds / 60)} min
                          {chargingStops.length > 0 && (
                            <> · {chargingStops.length} station{chargingStops.length !== 1 ? "s" : ""}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 sm:mt-0">
                        <p className="text-sm text-slate-500">
                          {new Date(t.createdAt).toLocaleString()}
                        </p>
                        <span
                          className={`inline-block text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden
                        >
                          ▼
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 ml-2 pl-4 border-l-2 border-slate-200">
                        <p className="mb-2 text-sm font-medium text-slate-600">
                          Saved charging stations
                        </p>
                        {chargingStops.length === 0 ? (
                          <p className="text-sm text-slate-500 py-2">
                            No charging stations saved for this trip.
                          </p>
                        ) : (
                          <ul className="space-y-2 pb-2">
                            {chargingStops.map((s, i) => (
                              <li
                                key={i}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                              >
                                <span className="font-medium">
                                  {s.name || `Station ${i + 1}`}
                                </span>
                                {s.latitude != null && s.longitude != null && (
                                  <span className="ml-2 text-slate-500">
                                    {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
