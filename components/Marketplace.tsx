"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  Compass,
  MapPin,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { fetchEvents, fetchRoutes, formatMoney, type Listing } from "@/lib/api";
import CheckoutModal from "@/components/CheckoutModal";
import TicketPreview from "@/components/TicketPreview";

const TABS = ["All", "Events", "Buses", "Travel & Tourism"] as const;
type Tab = (typeof TABS)[number];

const STATUS_LABEL: Record<string, string> = {
  "on-sale": "On sale",
  "selling-fast": "Selling fast",
  "sold-out": "Sold out",
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
  if (group === "Buses") return <Bus size={30} strokeWidth={1.5} />;
  if (group === "Events") return <CalendarDays size={30} strokeWidth={1.5} />;
  return <Compass size={30} strokeWidth={1.5} />;
}

export default function Marketplace() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null); // ticket preview
  const [checkout, setCheckout] = useState<Listing | null>(null); // payment step

  // Route search (Leaving from / Going to / date / passengers)
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
    setTab("Buses"); // a route search only makes sense for buses
    setSearch("");
    setApplied({ ...form, returnDate: trip === "return" ? form.returnDate : "" });
  };

  const clearSearch = () => {
    setApplied(null);
    setForm(EMPTY_FORM);
    setTrip("one-way");
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = applied?.from.trim().toLowerCase() ?? "";
    const to = applied?.to.trim().toLowerCase() ?? "";

    return items.filter((i) => {
      if (tab !== "All" && i.group !== tab) return false;

      if (applied) {
        // If your route listings have dedicated origin/destination fields,
        // match against those here instead of the combined text.
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
    <>
      {/* ───────── Bus route search ───────── */}
      <form className="lum-bus-search" onSubmit={runSearch}>
        <div className="lum-trip-toggle" role="radiogroup" aria-label="Trip type">
          {(["one-way", "return"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={trip === t}
              className={trip === t ? "active" : ""}
              onClick={() => setTrip(t)}
            >
              {t === "one-way" ? "One way" : "Return"}
            </button>
          ))}
        </div>

        <div className="lum-bus-search-fields">
          <label className="lum-bs-field">
            <MapPin size={16} />
            <input
              placeholder="Leaving from"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              aria-label="Leaving from"
              autoComplete="off"
            />
          </label>

          <label className="lum-bs-field">
            <Bus size={16} />
            <input
              placeholder="Going to"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              aria-label="Going to"
              autoComplete="off"
            />
          </label>

          <label className="lum-bs-field">
            <CalendarDays size={16} />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              aria-label="Departure date"
            />
          </label>

          {trip === "return" && (
            <label className="lum-bs-field">
              <CalendarDays size={16} />
              <input
                type="date"
                min={form.date || undefined}
                value={form.returnDate}
                onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                aria-label="Return date"
              />
            </label>
          )}

          <label className="lum-bs-field">
            <Users size={16} />
            <select
              value={form.passengers}
              onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
              aria-label="Passengers"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} passenger{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="lum-bus-search-actions">
          <button type="submit" className="lum-bs-submit">
            Search
          </button>
          {applied && (
            <button type="button" className="lum-bs-clear" onClick={clearSearch}>
              Clear
            </button>
          )}
        </div>
      </form>

      {/* ───────── Tabs + keyword search ───────── */}
      <div className="lum-discovery-tools">
        <div className="lum-category-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              className={tab === t ? "active" : ""}
              aria-selected={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="lum-experience-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes, events, cities…"
            aria-label="Search tickets"
          />
        </label>
      </div>

      {applied && (applied.from || applied.to || applied.date) && (
        <p className="lum-search-summary" role="status">
          Showing {filtered.length} result{filtered.length === 1 ? "" : "s"}
          {applied.from && <> from <strong>{applied.from}</strong></>}
          {applied.to && <> to <strong>{applied.to}</strong></>}
          {applied.date && <> on <strong>{applied.date}</strong></>}
        </p>
      )}

      {/* ───────── Results ───────── */}
      {loading ? (
        <div className="lum-mkt-grid" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="lum-mkt-card lum-skeleton" key={i} />
          ))}
        </div>
      ) : failed ? (
        <div className="lum-empty-state" role="alert">
          <p>We couldn&apos;t load tickets right now.</p>
          <button className="lum-button-outline-sm lum-retry" onClick={load}>
            <RefreshCw size={15} />
            <span>Try again</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="lum-empty-state" role="status">
          {items.length === 0
            ? "No tickets are on sale yet. Check back soon."
            : applied
              ? "No buses match that route or date. Try different cities or clear the search."
              : "Nothing matches your search. Try another keyword or category."}
        </p>
      ) : (
        <div className="lum-mkt-grid">
          {filtered.map((item) => {
            const soldOut = item.status === "sold-out";
            return (
              <article className="lum-mkt-card" key={item.key}>
                <div
                  className={`lum-mkt-visual is-${
                    item.group === "Buses" ? "bus" : item.group === "Events" ? "event" : "travel"
                  }`}
                >
                  <GroupIcon group={item.group} />
                  <span className={`lum-status is-${item.status}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>
                <div className="lum-mkt-body">
                  <span className="lum-card-category">{item.group}</span>
                  <h3>{item.title}</h3>
                  {item.subtitle && <p className="lum-mkt-sub">{item.subtitle}</p>}
                  <ul className="lum-mkt-meta">
                    {item.place && (
                      <li>
                        <MapPin size={13} />
                        {item.place}
                      </li>
                    )}
                    {item.startsAt && (
                      <li>
                        <CalendarDays size={13} />
                        {new Date(item.startsAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                      </li>
                    )}
                    {item.meta.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <div className="lum-mkt-foot">
                    <span className="lum-mkt-price">
                      <small>From</small>
                      {formatMoney(item.fromPrice, item.currency)}
                    </span>
                    <button
                      className="lum-button-primary-card"
                      disabled={soldOut}
                      onClick={() => setSelected(item)}
                    >
                      <span>{soldOut ? "Sold out" : "Buy now"}</span>
                      {!soldOut && <ArrowRight size={16} />}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && !checkout && (
        <TicketPreview item={selected} onClose={() => setSelected(null)} onContinue={() => setCheckout(selected)} />
      )}
      {checkout && (
        <CheckoutModal
          item={checkout}
          onClose={() => {
            setCheckout(null);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
