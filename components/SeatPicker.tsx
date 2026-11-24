"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock, Loader2, RefreshCw } from "lucide-react";
import { fetchDepartures, fetchSeatMap, formatMoney, type Departure, type SeatMap } from "@/lib/api";

export interface SeatChoice {
  departure: Departure;
  seats: string[];
}

function when(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: iso, time: "" };
  return {
    day: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Step 1 of buying a bus ticket: choose a departure, then tap the seats you want on the bus map.
 * Taken seats are greyed out and the map refreshes every 15 seconds while it is open.
 */
export default function SeatPicker({
  routeId,
  initial,
  error,
  onConfirm,
}: {
  routeId: number;
  initial?: SeatChoice | null;
  error?: string;
  onConfirm: (choice: SeatChoice) => void;
}) {
  const [departures, setDepartures] = useState<Departure[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [departure, setDeparture] = useState<Departure | null>(initial?.departure ?? null);
  const [map, setMap] = useState<SeatMap | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [picked, setPicked] = useState<string[]>(initial?.seats ?? []);
  const [note, setNote] = useState("");

  const loadDepartures = useCallback(async () => {
    setLoadFailed(false);
    setDepartures(null);
    try {
      setDepartures(await fetchDepartures(routeId));
    } catch {
      setLoadFailed(true);
    }
  }, [routeId]);

  useEffect(() => {
    void loadDepartures();
  }, [loadDepartures]);

  // Load (and keep refreshing) the seat map of the chosen departure.
  useEffect(() => {
    if (!departure) return;
    let alive = true;
    const load = async () => {
      try {
        const next = await fetchSeatMap(departure.id);
        if (!alive) return;
        setMap(next);
        setMapFailed(false);
        setPicked((cur) => {
          const stillFree = cur.filter((s) => !next.taken.includes(s));
          if (stillFree.length !== cur.length) setNote("A seat you chose was just taken. Please pick another.");
          return stillFree;
        });
      } catch {
        if (alive) setMapFailed(true);
      }
    };
    setMap(null);
    void load();
    const timer = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [departure]);

  const taken = useMemo(() => new Set(map?.taken ?? []), [map]);
  const max = Math.max(1, map?.maxPerOrder ?? 1);

  function toggle(seat: string) {
    setNote("");
    setPicked((cur) => {
      if (cur.includes(seat)) return cur.filter((s) => s !== seat);
      if (cur.length >= max) {
        setNote(`You can book up to ${max} seat${max > 1 ? "s" : ""} at a time.`);
        return cur;
      }
      return [...cur, seat].sort((a, b) => Number(a) - Number(b));
    });
  }

  /* ───────── 1. choose a departure ───────── */
  if (!departure) {
    return (
      <section className="lum-seatpicker" aria-label="Choose a departure">
        <h4 className="lum-step-title"><span>1</span> Choose your departure</h4>
        {error && <p className="lum-form-error" role="alert">{error}</p>}
        {loadFailed ? (
          <div className="lum-empty-inline" role="alert">
            <p>We couldn&apos;t load departures.</p>
            <button type="button" className="lum-link-button" onClick={loadDepartures}>
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : departures === null ? (
          <p className="lum-empty-inline"><Loader2 className="lum-spin" size={18} /> Loading departures…</p>
        ) : departures.length === 0 ? (
          <p className="lum-empty-inline">No departures are open for booking on this route yet. Please check back soon.</p>
        ) : (
          <ul className="lum-departures">
            {departures.map((d) => {
              const w = when(d.departureAt);
              const full = d.seatsLeft <= 0;
              return (
                <li key={d.id}>
                  <button type="button" disabled={full} onClick={() => { setDeparture(d); setPicked([]); setNote(""); }}>
                    <span className="lum-dep-when">
                      <CalendarDays size={18} /> {w.day}
                      <Clock size={18} /> {w.time}
                    </span>
                    <span className="lum-dep-meta">
                      <strong>{formatMoney(d.price, d.currency)}</strong>
                      <small className={d.seatsLeft <= 5 ? "is-low" : ""}>{full ? "Full" : `${d.seatsLeft} seats left`}</small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  /* ───────── 2. choose seats ───────── */
  const w = when(departure.departureAt);
  const seats = Array.from({ length: map?.seatsTotal ?? departure.seatsTotal }, (_, i) => String(i + 1));
  const total = picked.length * departure.price;

  return (
    <section className="lum-seatpicker" aria-label="Choose your seats">
      <h4 className="lum-step-title"><span>2</span> Choose your seats</h4>
      <p className="lum-seat-trip">
        <strong>{w.day} · {w.time}</strong>
        <button type="button" className="lum-link-button" onClick={() => { setDeparture(null); setPicked([]); setMap(null); setNote(""); }}>
          Change departure
        </button>
      </p>

      <ul className="lum-seat-legend" aria-hidden="true">
        <li><i className="lum-seat-dot is-free" /> Available</li>
        <li><i className="lum-seat-dot is-picked" /> Your seat</li>
        <li><i className="lum-seat-dot is-taken" /> Taken</li>
      </ul>

      {mapFailed && !map ? (
        <div className="lum-empty-inline" role="alert">
          <p>We couldn&apos;t load the seat map.</p>
        </div>
      ) : !map ? (
        <p className="lum-empty-inline"><Loader2 className="lum-spin" size={18} /> Loading seat map…</p>
      ) : (
        <div className="lum-bus-map">
          <div className="lum-bus-front" aria-hidden="true">
            <span className="lum-wheel" />
            <span>Front of bus</span>
          </div>
          <div className="lum-seat-grid" role="group" aria-label="Seats">
            {seats.map((seat) => {
              const isTaken = taken.has(seat);
              const isPicked = picked.includes(seat);
              return (
                <button
                  key={seat}
                  type="button"
                  className={`lum-seat${isPicked ? " is-picked" : ""}${isTaken ? " is-taken" : ""}`}
                  disabled={isTaken}
                  aria-pressed={isPicked}
                  aria-label={`Seat ${seat}${isTaken ? ", taken" : isPicked ? ", selected" : ", available"}`}
                  onClick={() => toggle(seat)}
                >
                  {seat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(note || error) && <p className="lum-form-error" role="alert">{note || error}</p>}

      <div className="lum-seat-summary">
        <div>
          <small>{picked.length ? `Seat${picked.length > 1 ? "s" : ""} ${picked.join(", ")}` : "No seat selected yet"}</small>
          <strong>{formatMoney(total, departure.currency)}</strong>
        </div>
        <button
          type="button"
          className="lum-button-gold lum-seat-continue"
          disabled={picked.length === 0}
          onClick={() => onConfirm({ departure, seats: picked })}
        >
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
