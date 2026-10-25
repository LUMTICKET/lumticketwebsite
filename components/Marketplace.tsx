"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Bus,
  CalendarDays,
  Compass,
  MapPin,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { fetchEvents, fetchRoutes, formatMoney, type Listing } from "@/lib/api";
import CheckoutModal from "@/components/CheckoutModal";

const TABS = ["All", "Events", "Buses", "Travel & Tourism"] as const;
type Tab = (typeof TABS)[number];

const STATUS_LABEL: Record<string, string> = {
  "on-sale": "On sale",
  "selling-fast": "Selling fast",
  "sold-out": "Sold out",
};

const STATUS_STYLES: Record<string, string> = {
  "on-sale": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "selling-fast": "bg-amber-50 text-amber-700 border-amber-200",
  "sold-out": "bg-rose-50 text-rose-700 border-rose-200",
};

type TripType = "one-way" | "return";

type SearchForm = {
  from: string;
  to: string;
  date: string;
  returnDate: string;
  passengers: number;
};

const EMPTY_FORM: SearchForm = { from: "", to: "", date: "", returnDate: "", passengers: 1 };

function GroupIcon({ group }: { group: Listing["group"] }) {
  if (group === "Buses") return <Bus className="w-6 h-6 text-blue-600" />;
  if (group === "Events") return <CalendarDays className="w-6 h-6 text-purple-600" />;
  return <Compass className="w-6 h-6 text-emerald-600" />;
}

export default function Marketplace() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);

  // Route search states
  const [trip, setTrip] = useState<TripType>("one-way");
  const [form, setForm] = useState<SearchForm>(EMPTY_FORM);
  const [applied, setApplied] = useState<SearchForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const [events, routes] = await Promise.allSettled([fetchEvents(), fetchRoutes()]);
    const merged = [
      ...(routes.status === "fulfilled" ? routes.value : []),
      ...(events.status === "fulfilled" ? events.value : []),
    ];
    setItems(merged);
    setFailed(events.status === "rejected" && routes.status === "rejected");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTab("Buses"); // Route search defaults to Buses
    setSearch("");
    setApplied({ ...form, returnDate: trip === "return" ? form.returnDate : "" });
  };

  const clearSearch = () => {
    setApplied(null);
    setForm(EMPTY_FORM);
    setTrip("one-way");
  };

  const swapLocations = () => {
    setForm((prev) => ({ ...prev, from: prev.to, to: prev.from }));
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = applied?.from.trim().toLowerCase() ?? "";
    const to = applied?.to.trim().toLowerCase() ?? "";

    return items.filter((i) => {
      if (tab !== "All" && i.group !== tab) return false;

      if (applied) {
        const haystack = [i.title, i.subtitle, i.place, ...i.meta]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (from && !haystack.includes(from)) return false;
        if (to && !haystack.includes(to)) return false;
        if (applied.date && i.startsAt && i.startsAt.slice(0, 10) !== applied.date) return false;
      }

      return (
        !term ||
        [i.title, i.subtitle, i.operator, i.place, i.group]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(term))
      );
    });
  }, [items, tab, search, applied]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* ───────── Main Bus & Route Search Box ───────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        {/* Trip Type Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          {(["one-way", "return"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrip(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                trip === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "one-way" ? "One way" : "Return"}
            </button>
          ))}
        </div>

        {/* Input Fields Form */}
        <form onSubmit={runSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Leaving From */}
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                From
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Leaving from..."
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>

            {/* Swap Button (Desktop) */}
            <div className="hidden md:flex md:col-span-1 justify-center pt-5">
              <button
                type="button"
                onClick={swapLocations}
                title="Swap departure and arrival"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors border border-slate-200"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Going To */}
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                To
              </label>
              <div className="relative">
                <Bus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Going to..."
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>

            {/* Departure Date */}
            <div className={trip === "return" ? "md:col-span-2 relative" : "md:col-span-3 relative"}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Depart
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Return Date (Conditional) */}
            {trip === "return" && (
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Return
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    min={form.date || undefined}
                    value={form.returnDate}
                    onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Passengers */}
            <div className="md:col-span-1 relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Pass.
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={form.passengers}
                  onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
                  className="w-full pl-9 pr-2 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-800 appearance-none"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {applied && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Clear search
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Search tickets
            </button>
          </div>
        </form>
      </div>

      {/* ───────── Tabs & Keyword Search Bar ───────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Global Keyword Filter */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes, events, cities..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Applied Filter Summary */}
      {applied && (applied.from || applied.to || applied.date) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-sm flex items-center justify-between">
          <p>
            Showing <strong>{filtered.length}</strong> result{filtered.length === 1 ? "" : "s"}
            {applied.from && <> from <strong>{applied.from}</strong></>}
            {applied.to && <> to <strong>{applied.to}</strong></>}
            {applied.date && <> on <strong>{applied.date}</strong></>}
          </p>
          <button
            onClick={clearSearch}
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
          >
            Reset
          </button>
        </div>
      )}

      {/* ───────── Results Grid ───────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"
            />
          ))}
        </div>
      ) : failed ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-4">
          <p className="text-slate-600">We couldn&apos;t load tickets right now.</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">
            {items.length === 0
              ? "No tickets are on sale yet. Check back soon."
              : applied
              ? "No tickets match that route or date. Try different cities or clear the search."
              : "Nothing matches your search. Try another keyword or category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const soldOut = item.status === "sold-out";
            return (
              <article
                key={item.key}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Visual Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    <GroupIcon group={item.group} />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {item.group}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-sm text-slate-500 mt-1">{item.subtitle}</p>
                    )}

                    {/* Metadata list */}
                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                      {item.place && (
                        <li className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{item.place}</span>
                        </li>
                      )}
                      {item.startsAt && (
                        <li className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            {new Date(item.startsAt).toLocaleDateString("en-GB", {
                              dateStyle: "medium",
                            })}
                          </span>
                        </li>
                      )}
                      {item.meta.map((m) => (
                        <li key={m} className="flex items-center gap-2 text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        From
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        {formatMoney(item.fromPrice, item.currency)}
                      </span>
                    </div>

                    <button
