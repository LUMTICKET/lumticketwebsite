"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Armchair, Bus, CalendarDays, Compass, MapPin, RefreshCw, Search } from "lucide-react";
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

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const [events, routes] = await Promise.allSettled([fetchEvents(), fetchRoutes()]);
    const merged = [
      ...(routes.status === "fulfilled" ? routes.value : []),
      ...(events.status === "fulfilled" ? events.value : []),
    ];
    setItems(merged);
    if (events.status === "rejected") console.error("Could not load events:", events.reason);
    setFailed(events.status === "rejected"); // events are the ticket catalog; don't hide their failure behind routes
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== "All" && i.group !== tab) return false;
      return (
        !term ||
        [i.title, i.subtitle, i.operator, i.place, i.group]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(term))
      );
    });
  }, [items, tab, search]);

  return (
    <>
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
            placeholder="Search a city, route or event…"
            aria-label="Search tickets"
          />
        </label>
      </div>

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
            : "Nothing matches your search. Try another keyword or category."}
        </p>
      ) : (
        <div className="lum-mkt-grid">
          {filtered.map((item) => {
            const soldOut = item.status === "sold-out";
            const isBus = item.routeId !== undefined;
            const buyable = isBus ? item.fromPrice > 0 : !!item.tiers?.length;
            return (
              <article className="lum-mkt-card" key={item.key}>
                <div
                  className={`lum-mkt-visual is-${
                    item.group === "Buses" ? "bus" : item.group === "Events" ? "event" : "travel"
                  }${item.image ? " has-poster" : ""}`}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="lum-mkt-poster" src={item.image} alt={`${item.title} poster`} loading="lazy" />
                  ) : (
                    <GroupIcon group={item.group} />
                  )}
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
                      disabled={soldOut || !buyable}
                      onClick={() => (isBus ? setCheckout(item) : setSelected(item))}
                    >
                      {isBus && buyable && !soldOut && <Armchair size={18} />}
                      <span>{soldOut ? "Sold out" : buyable ? (isBus ? "Choose seats" : "Buy now") : "Coming soon"}</span>
                      {!soldOut && buyable && !isBus && <ArrowRight size={18} />}
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