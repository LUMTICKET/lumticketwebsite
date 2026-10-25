"use client";

import { useEffect, useId, useMemo } from "react";
import { ArrowRight, MousePointerClick, X } from "lucide-react";
import { formatMoney, type Listing } from "@/lib/api";

const NAVY = "#042045";
const NAVY_LIGHT = "#0b3769";
const GOLD = "#cc9f2f";
const GOLD_LIGHT = "#e0b84f";
const CREAM = "#fffdf7";

const STATUS_LABEL: Record<string, string> = {
  "on-sale": "On sale",
  "selling-fast": "Selling fast",
  "sold-out": "Sold out",
};

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/** Deterministic pseudo-QR so every ticket looks unique. Real QR is issued after payment. */
function qrCells(seed: string, n = 21) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h = h || 1;
  const rnd = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells.push([x, y]);
  return cells;
}

function Finder({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={7 * s} height={7 * s} rx={s} fill={NAVY} />
      <rect x={s} y={s} width={5 * s} height={5 * s} rx={s * 0.6} fill={CREAM} />
      <rect x={2 * s} y={2 * s} width={3 * s} height={3 * s} rx={s * 0.5} fill={NAVY} />
    </g>
  );
}

export function TicketSVG({ item }: { item: Listing }) {
  const uid = useId().replace(/:/g, "");
  const cells = useMemo(() => qrCells(item.key), [item.key]);

  const title = cut(item.title, 26);
  const titleSize = item.title.length > 20 ? 32 : 40;
  const date = item.startsAt
    ? new Date(item.startsAt).toLocaleDateString("en-GB", { dateStyle: "medium" })
    : "Flexible date";
  const where = cut(item.place ?? item.meta[0] ?? item.group, 24);
  const by = cut(item.operator ?? item.meta[1] ?? "LumTicket partner", 22);
  const cell = 6.4;
  const qx = 650 + (250 - 21 * cell) / 2;

  return (
    <svg
      className="lum-ticket-svg"
      viewBox="0 0 900 300"
      role="img"
      aria-label={`${item.title} ticket, from ${formatMoney(item.fromPrice, item.currency)}`}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={NAVY} />
          <stop offset="1" stopColor={NAVY_LIGHT} />
        </linearGradient>
        {/* Rounded ticket with perforation notches cut top and bottom */}
        <mask id={`${uid}-cut`}>
          <rect width="900" height="300" rx="22" fill="#fff" />
          <circle cx="650" cy="0" r="15" fill="#000" />
          <circle cx="650" cy="300" r="15" fill="#000" />
        </mask>
        <clipPath id={`${uid}-stub`}>
          <rect x="650" width="250" height="300" />
        </clipPath>
      </defs>

      <g mask={`url(#${uid}-cut)`}>
        {/* Main body */}
        <rect width="900" height="300" fill={`url(#${uid}-bg)`} />
        <circle cx="0" cy="0" r="58" fill={GOLD} />
        <circle cx="610" cy="300" r="40" fill={GOLD_LIGHT} opacity="0.95" />
        <circle cx="560" cy="150" r="150" fill="none" stroke={GOLD} strokeOpacity="0.14" strokeWidth="1.5" />
        <circle cx="560" cy="150" r="108" fill="none" stroke={GOLD} strokeOpacity="0.1" strokeWidth="1.5" />

        {/* Stub */}
        <g clipPath={`url(#${uid}-stub)`}>
          <rect x="650" width="250" height="300" fill={CREAM} />
        </g>
      </g>

      {/* Perforation */}
      <line x1="650" y1="24" x2="650" y2="276" stroke={GOLD} strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />

      {/* Body content */}
      <circle cx="52" cy="92" r="4" fill={GOLD} />
      <text x="64" y="96" fill={GOLD_LIGHT} fontSize="14" fontWeight="700">
        {item.group}
      </text>

      <rect x="486" y="76" width="118" height="28" rx="14" fill={GOLD} />
      <text x="545" y="95" textAnchor="middle" fill={NAVY} fontSize="13" fontWeight="800">
        {STATUS_LABEL[item.status] ?? item.status}
      </text>

      <text x="44" y="150" fill={CREAM} fontSize={titleSize} fontWeight="750" letterSpacing="-1.2">
        {title}
      </text>
      {item.subtitle && (
        <text x="44" y="180" fill="#c1ccda" fontSize="16">
          {cut(item.subtitle, 46)}
        </text>
      )}

      <line x1="44" y1="206" x2="604" y2="206" stroke={CREAM} strokeOpacity="0.16" />
      {[
        { x: 44, label: "Date", value: date },
        { x: 214, label: "Where", value: where },
        { x: 424, label: "Operator", value: by },
      ].map((c) => (
        <g key={c.label}>
          <text x={c.x} y="230" fill={GOLD_LIGHT} fontSize="11" fontWeight="700">
            {c.label}
          </text>
          <text x={c.x} y="251" fill={CREAM} fontSize="16" fontWeight="650">
            {c.value}
          </text>
        </g>
      ))}

      {/* Brand */}
      <rect x="44" y="266" width="22" height="22" rx="6" fill={CREAM} />
      <text x="55" y="282" textAnchor="middle" fill={NAVY} fontSize="14" fontWeight="800">
        L
      </text>
      <text x="76" y="282" fill="#c1ccda" fontSize="13" fontWeight="600">
        Powered by{" "}
        <tspan fill={CREAM} fontWeight="800">
          Lum
        </tspan>
        <tspan fill={GOLD_LIGHT} fontWeight="800">
          Ticket
        </tspan>
      </text>

      {/* Stub content: locked QR + price */}
      <g opacity="0.9">
        <Finder x={qx} y={46} s={cell} />
        <Finder x={qx + 14 * cell} y={46} s={cell} />
        <Finder x={qx} y={46 + 14 * cell} s={cell} />
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={qx + x * cell} y={46 + y * cell} width={cell - 0.6} height={cell - 0.6} rx="1" fill={NAVY} />
        ))}
      </g>
      <text x="775" y="206" textAnchor="middle" fill="#788394" fontSize="11" fontWeight="600">
        Your QR code unlocks after payment
      </text>
      <line x1="680" y1="222" x2="870" y2="222" stroke={NAVY} strokeOpacity="0.14" strokeDasharray="3 5" />
      <text x="680" y="246" fill="#788394" fontSize="11" fontWeight="600">
        From
      </text>
      <text x="680" y="276" fill={NAVY} fontSize="26" fontWeight="800" letterSpacing="-0.8">
        {formatMoney(item.fromPrice, item.currency)}
      </text>
    </svg>
  );
}

export default function TicketPreview({
  item,
  onClose,
  onContinue,
}: {
  item: Listing;
  onClose: () => void;
  onContinue: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const rows: [string, string][] = [
    ["Type", item.group],
    ["Date", item.startsAt ? new Date(item.startsAt).toLocaleDateString("en-GB", { dateStyle: "full" }) : "Flexible"],
    ["Where", item.place ?? "—"],
    ["Operator", item.operator ?? "LumTicket partner"],
    ["Availability", STATUS_LABEL[item.status] ?? item.status],
    ["Price", `From ${formatMoney(item.fromPrice, item.currency)}`],
  ];

  return (
    <div className="lum-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lum-modal lum-modal-wide" role="dialog" aria-modal="true" aria-label={`${item.title} ticket`}>
        <button className="lum-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="lum-modal-head">
          <span className="lum-card-category">{item.group}</span>
          <h3>Your ticket</h3>
          <p>Review the details, then tap the ticket to pay.</p>
        </div>

        <button type="button" className="lum-ticket-button" onClick={onContinue} aria-label="Continue to payment">
          <TicketSVG item={item} />
          <span className="lum-ticket-hint">
            <MousePointerClick size={15} />
            Tap the ticket to pay as a guest, log in or sign up
          </span>
        </button>

        <dl className="lum-ticket-details">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        {item.meta.length > 0 && (
          <ul className="lum-ticket-chips">
            {item.meta.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}

        <button className="lum-button-primary-card lum-submit" onClick={onContinue}>
          <span>Continue to payment</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
