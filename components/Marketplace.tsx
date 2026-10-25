"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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

function GroupIcon({ group }: { group?: string }) {
  if (group === "Buses") return <Bus className="w-6 h-6 text-blue-600" />;
  if (group === "Events") return <CalendarDays className="w-6 h-6 text-purple-600" />;
  return <Compass className="w-6 h-6 text-emerald-600" />;
}

export default function Marketplace() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState<boolean>(false);
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<Listing | null>(null);

  // Route search states
  const [trip, setTrip] = useState<TripType>("one-way");
  const [form, setForm] = useState<SearchForm>(EMPTY_FORM);
  const [applied, setApplied] = useState<SearchForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [events, routes] = await Promise.allSettled([fetchEvents(), fetchRoutes()]);
      const merged: Listing[] = [
        ...(routes.status === "fulfilled" && Array.isArray(routes.value) ? routes.value : []),
        ...(events.status === "fulfilled" && Array.isArray(events.value) ? events.value : []),
      ];
      setItems(merged);
      setFailed(events.status === "rejected" && routes.status === "rejected");
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTab("Buses");
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
        const metaList = Array.isArray(i.meta) ? i.meta : [];
        const haystack = [i.title, i.subtitle, i.place, ...metaList]
          .filter((val): val is string => Boolean(val))
          .join(" ")
          .toLowerCase();

        if (from && !haystack.includes(from)) return false;
        if (to && !haystack.includes(to)) return false;
        if (applied.date && i.startsAt && i.startsAt.slice(0, 10) !== applied.date) return false;
      }

      return (
        !term ||
        [i.title, i.subtitle, (i as Record<string, unknown>).operator, i.place, i.group]
          .filter((f): f is string => typeof f === "string" && Boolean(f.trim()))
          .some((f) => f.toLowerCase().includes(term))
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, from: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>

            {/* Swap Button */}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, to: e.target.value })
                  }
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, date: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Return Date */}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, returnDate: e.target.value })
                    }
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setForm({ ...form, passengers: Number(e.target.value) })
                  }
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
              className="px-6 py-2.5 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-50
