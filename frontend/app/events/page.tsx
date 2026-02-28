"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvents,
  setFilters,
  setPage,
  resetFilters,
  defaultFilters,
  type EventFilters,
} from "../../store/eventsSlice";
import { hydrateAuth, logout } from "../../store/authSlice";

/* ------------------------------------------------------------------ */
/*  Filter-option constants                                           */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = [
  { value: "", label: "All types" },
  { value: "connect", label: "Connect" },
  { value: "elevate", label: "Elevate" },
];

const MODES = [
  { value: "", label: "All modes" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const REG_TYPES = [
  { value: "", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const WHO_CAN = [
  { value: "", label: "All" },
  { value: "only_bob_member", label: "BOB Members" },
  { value: "public_users_bob_members", label: "Public + BOB" },
];

const SCHEDULES = [
  { value: "", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "custom", label: "Custom dates" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "blue" | "orange" }) {
  const colors = {
    default: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, total, loading, error, filters } = useAppSelector(
    (s) => s.events
  );
  const auth = useAppSelector((s) => s.auth);

  const [showFilters, setShowFilters] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    dispatch(hydrateAuth());
    setAuthChecked(true);
  }, [dispatch]);

  useEffect(() => {
    if (!authChecked) return;
    if (!auth.token || auth.role !== "Member") {
      router.replace("/login");
    }
  }, [authChecked, auth.token, auth.role, router]);

  const loadEvents = useCallback(
    (f: EventFilters) => {
      dispatch(fetchEvents(f));
    },
    [dispatch]
  );

  useEffect(() => {
    if (auth.token && auth.role === "Member") {
      loadEvents(filters);
    }
  }, [filters, loadEvents, auth.token, auth.role]);

  if (!authChecked || !auth.token || auth.role !== "Member") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  /* Formik drives the filter sidebar */
  const formik = useFormik<Omit<EventFilters, "page" | "per_page">>({
    initialValues: {
      event_type: filters.event_type,
      mode_of_event: filters.mode_of_event,
      city: filters.city,
      state: filters.state,
      registration_type: filters.registration_type,
      who_can_register: filters.who_can_register,
      schedule: filters.schedule,
      start_date: filters.start_date,
      end_date: filters.end_date,
      sort: filters.sort,
      q: filters.q,
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      dispatch(setFilters(values));
    },
  });

  const handleReset = () => {
    dispatch(resetFilters());
    formik.resetForm({ values: { ...defaultFilters } });
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  const totalPages = Math.ceil(total / filters.per_page) || 1;

  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold text-slate-800">
            ⚡ Smart EV
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-blue-600"
            >
              Trip Planner
            </Link>
            <Link
              href="/events"
              className="text-sm font-semibold text-blue-600"
            >
              Events
            </Link>
            {auth.token ? (
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Page title row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Discover Events
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {total} event{total !== 1 ? "s" : ""} available
            </p>
          </div>
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="btn-secondary !w-auto gap-2 lg:hidden"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
        </div>

        <div className="flex gap-6">
          {/* ---- Filter sidebar ---- */}
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } w-full shrink-0 lg:block lg:w-72`}
          >
            <form
              onSubmit={formik.handleSubmit}
              className="card sticky top-20 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Reset all
                </button>
              </div>

              {/* Search */}
              <div>
                <label htmlFor="q" className="label">
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  type="text"
                  placeholder="Search events…"
                  className="input-base"
                  value={formik.values.q}
                  onChange={formik.handleChange}
                />
              </div>

              {/* Event type */}
              <div>
                <label htmlFor="event_type" className="label">
                  Event type
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  className="input-base"
                  value={formik.values.event_type}
                  onChange={formik.handleChange}
                >
                  {EVENT_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode */}
              <div>
                <label htmlFor="mode_of_event" className="label">
                  Mode
                </label>
                <select
                  id="mode_of_event"
                  name="mode_of_event"
                  className="input-base"
                  value={formik.values.mode_of_event}
                  onChange={formik.handleChange}
                >
                  {MODES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Registration type */}
              <div>
                <label htmlFor="registration_type" className="label">
                  Registration
                </label>
                <select
                  id="registration_type"
                  name="registration_type"
                  className="input-base"
                  value={formik.values.registration_type}
                  onChange={formik.handleChange}
                >
                  {REG_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Who can register */}
              <div>
                <label htmlFor="who_can_register" className="label">
                  Audience
                </label>
                <select
                  id="who_can_register"
                  name="who_can_register"
                  className="input-base"
                  value={formik.values.who_can_register}
                  onChange={formik.handleChange}
                >
                  {WHO_CAN.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule */}
              <div>
                <label htmlFor="schedule" className="label">
                  Schedule
                </label>
                <select
                  id="schedule"
                  name="schedule"
                  className="input-base"
                  value={formik.values.schedule}
                  onChange={formik.handleChange}
                >
                  {SCHEDULES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom date range */}
              {formik.values.schedule === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="start_date" className="label">
                      From
                    </label>
                    <input
                      id="start_date"
                      name="start_date"
                      type="date"
                      className="input-base"
                      value={formik.values.start_date}
                      onChange={formik.handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="end_date" className="label">
                      To
                    </label>
                    <input
                      id="end_date"
                      name="end_date"
                      type="date"
                      className="input-base"
                      value={formik.values.end_date}
                      onChange={formik.handleChange}
                    />
                  </div>
                </div>
              )}

              {/* City / State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="label">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="e.g. delhi"
                    className="input-base"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="state" className="label">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="e.g. delhi"
                    className="input-base"
                    value={formik.values.state}
                    onChange={formik.handleChange}
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label htmlFor="sort" className="label">
                  Sort by
                </label>
                <select
                  id="sort"
                  name="sort"
                  className="input-base"
                  value={formik.values.sort}
                  onChange={formik.handleChange}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary">
                Apply filters
              </button>
            </form>
          </aside>

          {/* ---- Main content ---- */}
          <main className="flex-1">
            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card animate-pulse space-y-3">
                    <div className="h-40 rounded-lg bg-slate-200" />
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
                <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <h3 className="text-base font-semibold text-slate-700">
                  No events found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting your filters or search query.
                </p>
              </div>
            )}

            {/* Event cards grid */}
            {!loading && items.length > 0 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((ev) => (
                    <article
                      key={ev.id}
                      className="card group flex flex-col overflow-hidden transition hover:shadow-md"
                    >
                      {/* Banner */}
                      {ev.banner_image ? (
                        <div className="-mx-6 -mt-6 mb-4 h-44 overflow-hidden bg-slate-100">
                          <img
                            src={ev.banner_image}
                            alt={ev.title}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="-mx-6 -mt-6 mb-4 flex h-44 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                          <span className="text-4xl">📅</span>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {ev.event_type && (
                          <Badge variant="blue">
                            {ev.event_type}
                          </Badge>
                        )}
                        {ev.mode_of_event && (
                          <Badge variant={ev.mode_of_event === "online" ? "green" : "orange"}>
                            {ev.mode_of_event}
                          </Badge>
                        )}
                        {ev.registration_type && (
                          <Badge variant={ev.registration_type === "free" ? "green" : "orange"}>
                            {ev.registration_type}
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="mb-1 line-clamp-2 text-base font-semibold text-slate-800">
                        {ev.title}
                      </h3>

                      {/* Date */}
                      {(ev.start_date || ev.end_date) && (
                        <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(ev.start_date)}
                          {ev.end_date && ev.end_date !== ev.start_date && (
                            <> – {formatDate(ev.end_date)}</>
                          )}
                        </p>
                      )}

                      {/* Location */}
                      {(ev.city || ev.venue) && (
                        <p className="mb-3 flex items-center gap-1 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {[ev.venue, ev.city, ev.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}

                      {/* Description snippet */}
                      {ev.description && (
                        <p
                          className="mt-auto line-clamp-2 text-xs leading-relaxed text-slate-500"
                          dangerouslySetInnerHTML={{
                            __html: ev.description.replace(/<[^>]+>/g, "").slice(0, 160),
                          }}
                        />
                      )}
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-8 flex items-center justify-center gap-2">
                    <button
                      disabled={filters.page <= 1}
                      onClick={() => dispatch(setPage(filters.page - 1))}
                      className="btn-secondary !w-auto !px-3 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="mx-2 text-sm text-slate-600">
                      Page {filters.page} of {totalPages}
                    </span>
                    <button
                      disabled={filters.page >= totalPages}
                      onClick={() => dispatch(setPage(filters.page + 1))}
                      className="btn-secondary !w-auto !px-3 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
