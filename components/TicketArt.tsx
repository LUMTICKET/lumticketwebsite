"use client";

import { useEffect, useId, useMemo, useState } from "react";
import QRCode from "qrcode";
import { formatMoney, type Listing } from "@/lib/api";

const NAVY = "#042045";
const NAVY_LIGHT = "#0b3769";
const GOLD = "#cc9f2f";
const GOLD_LIGHT = "#e0b84f";
const CREAM = "#fffdf7";
const MUTED = "#c1ccda";

const STATUS_LABEL: Record<string, string> = {
  "on-sale": "On sale",
  "selling-fast": "Selling fast",
  "sold-out": "Sold out",
};

/** Details of a purchased ticket. When present, the ticket shows a real, scannable QR code. */
export interface PaidInfo {
  /** The LMT-… booking reference returned by POST /api/bookings. This is exactly what gets encoded. */
  reference: string;
  quantity: number;
  /** Pre-formatted total, e.g. "MWK 15,000" */
  total: string;
  /** Pre-formatted date/time of travel or event */
  when: string;
  holder?: string;
}

export type TicketLayout = "wide" | "tall" | "auto";

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function wrap(text: string, max: number, lines: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length <= max) line = (line + " " + w).trim();
    else {
      if (line) out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  if (out.length > lines) {
    const kept = out.slice(0, lines);
    kept[lines - 1] = cut(out.slice(lines - 1).join(" "), max);
    return kept;
  }
  return out;
}

export function useNarrow(max = 600) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(`(max-width:${max}px)`).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${max}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [max]);
  return narrow;
}

/* ----------------------------------- QR ------------------------------------ */

/**
 * The QR payload is the booking reference only (e.g. "LMT-BUS-8F3K2M").
 * Operator scanners send that string as `code` to POST /api/validations, which resolves it to the
 * ticket and answers valid / invalid / duplicate. Nothing else is stored in the code, so it can't be forged
 * by editing details, and the server stays the single source of truth.
 */
function useQrPath(value: string) {
  return useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
    return { n, d };
  }, [value]);
}

function QrBlock({ value, x, y, size }: { value: string; x: number; y: number; size: number }) {
  const { n, d } = useQrPath(value);
  const cell = size / (n + 4); // 2-module quiet zone each side
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={size} height={size} rx={size * 0.07} fill="#fff" stroke={GOLD} strokeOpacity="0.4" />
      <g transform={`translate(${2 * cell} ${2 * cell}) scale(${cell})`}>
        <path d={d} fill={NAVY} shapeRendering="crispEdges" />
      </g>
    </g>
  );
}

/** Decorative placeholder shown before payment. Intentionally not scannable. */
function FakeQr({ seed, x, y, size }: { seed: string; x: number; y: number; size: number }) {
  const n = 21;
  const cell = size / (n + 4);
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    h = h || 1;
    const rnd = () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
    const finder = (a: number, b: number) => (a < 8 && b < 8) || (a > n - 9 && b < 8) || (a < 8 && b > n - 9);
    const out: [number, number][] = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (!finder(i, j) && rnd() > 0.52) out.push([i, j]);
    return out;
  }, [seed]);
  const Finder = ({ fx, fy }: { fx: number; fy: number }) => (
    <g transform={`translate(${fx} ${fy})`}>
      <rect width="7" height="7" rx="1" fill={NAVY} />
      <rect x="1" y="1" width="5" height="5" rx="0.6" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" rx="0.5" fill={NAVY} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.85">
      <rect width={size} height={size} rx={size * 0.07} fill="#fff" stroke={GOLD} strokeOpacity="0.4" />
      <g transform={`translate(${2 * cell} ${2 * cell}) scale(${cell})`}>
        <Finder fx={0} fy={0} />
        <Finder fx={n - 7} fy={0} />
        <Finder fx={0} fy={n - 7} />
        {cells.map(([i, j]) => (
          <rect key={`${i}-${j}`} x={i + 0.05} y={j + 0.05} width="0.9" height="0.9" fill={NAVY} />
        ))}
      </g>
    </g>
  );
}

/* --------------------------------- ticket ---------------------------------- */

export function TicketSVG({
  item,
  paid,
  layout = "auto",
}: {
  item: Listing;
  paid?: PaidInfo;
  layout?: TicketLayout;
}) {
  const narrow = useNarrow();
  const tall = layout === "tall" || (layout === "auto" && narrow);
  const uid = useId().replace(/:/g, "");

  const when = paid?.when ?? (item.startsAt ? new Date(item.startsAt).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "Flexible date");
  const where = item.place ?? item.meta[0] ?? item.group;
  const admits = paid ? `${paid.quantity} ${paid.quantity > 1 ? "tickets" : "ticket"}` : undefined;
  const third = admits
    ? { label: "Admits", value: admits }
    : { label: "Operator", value: item.operator ?? item.meta[1] ?? "LumTicket partner" };
  const pill = paid ? "Confirmed" : (STATUS_LABEL[item.status] ?? item.status);
  const sub = [item.subtitle, paid?.holder && `for ${paid.holder}`].filter(Boolean).join(" · ");
  const priceLabel = paid ? "Total paid" : "From";
  const priceValue = paid ? paid.total : formatMoney(item.fromPrice, item.currency);
  const label = paid
    ? `${item.title} ticket, reference ${paid.reference}, ${paid.quantity} ${paid.quantity > 1 ? "tickets" : "ticket"}`
    : `${item.title} ticket, from ${priceValue}`;

  const W = tall ? 360 : 900;
  const H = tall ? 660 : 300;
  const SPLIT = tall ? 440 : 650; // perforation position

  const brand = (x: number, y: number) => (
    <g>
      <rect x={x} y={y - 16} width="22" height="22" rx="6" fill={CREAM} />
      <text x={x + 11} y={y} textAnchor="middle" fill={NAVY} fontSize="14" fontWeight="800">
        L
      </text>
      <text x={x + 32} y={y} fill={MUTED} fontSize="13" fontWeight="600">
        Powered by{" "}
        <tspan fill={CREAM} fontWeight="800">
          Lum
        </tspan>
        <tspan fill={GOLD_LIGHT} fontWeight="800">
          Ticket
        </tspan>
      </text>
    </g>
  );

  /* ---------- body content ---------- */
  let body: React.ReactNode;
  if (tall) {
    const lines = wrap(item.title, 17, 2);
    const shift = lines.length === 1 ? -38 : 0;
    const rows = [
      { label: "Date", value: cut(when, 28) },
      { label: "Where", value: cut(where, 28) },
      { label: third.label, value: cut(third.value, 28) },
    ];
    body = (
      <>
        <circle cx="36" cy="64" r="4" fill={GOLD} />
        <text x="48" y="68" fill={GOLD_LIGHT} fontSize="14" fontWeight="700">
          {item.group}
        </text>
        <rect x="222" y="46" width="110" height="28" rx="14" fill={GOLD} />
        <text x="277" y="65" textAnchor="middle" fill={NAVY} fontSize="13" fontWeight="800">
          {pill}
        </text>
        {lines.map((l, i) => (
          <text key={i} x="28" y={132 + i * 38} fill={CREAM} fontSize="32" fontWeight="750" letterSpacing="-1">
            {l}
          </text>
        ))}
        {sub && (
          <text x="28" y={206 + shift} fill={MUTED} fontSize="15">
            {cut(sub, 38)}
          </text>
        )}
        <line x1="28" y1={228 + shift} x2="332" y2={228 + shift} stroke={CREAM} strokeOpacity="0.16" />
        {rows.map((r, i) => (
          <g key={r.label}>
            <text x="28" y={254 + shift + i * 52} fill={GOLD_LIGHT} fontSize="11" fontWeight="700">
              {r.label}
            </text>
            <text x="28" y={275 + shift + i * 52} fill={CREAM} fontSize="17" fontWeight="650">
              {r.value}
            </text>
          </g>
        ))}
        {brand(28, 424)}
        <text x="332" y="424" textAnchor="end" fill={GOLD_LIGHT} fontSize="17" fontWeight="800">
          {priceValue}
        </text>
      </>
    );
  } else {
    const titleSize = item.title.length > 20 ? 32 : 40;
    body = (
      <>
        <circle cx="52" cy="92" r="4" fill={GOLD} />
        <text x="64" y="96" fill={GOLD_LIGHT} fontSize="14" fontWeight="700">
          {item.group}
        </text>
        <rect x="486" y="76" width="118" height="28" rx="14" fill={GOLD} />
        <text x="545" y="95" textAnchor="middle" fill={NAVY} fontSize="13" fontWeight="800">
          {pill}
        </text>
        <text x="44" y="150" fill={CREAM} fontSize={titleSize} fontWeight="750" letterSpacing="-1.2">
          {cut(item.title, 26)}
        </text>
        {sub && (
          <text x="44" y="180" fill={MUTED} fontSize="16">
            {cut(sub, 52)}
          </text>
        )}
        <line x1="44" y1="206" x2="604" y2="206" stroke={CREAM} strokeOpacity="0.16" />
        {[
          { x: 44, label: "Date", value: cut(when, 20) },
          { x: 214, label: "Where", value: cut(where, 24) },
          { x: 424, label: third.label, value: cut(third.value, 22) },
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
        {brand(44, 282)}
      </>
    );
  }

  /* ---------- stub content ---------- */
  const qrSize = tall ? 142 : 160;
  const qx = tall ? (W - qrSize) / 2 : 650 + (250 - qrSize) / 2;
  const qy = tall ? 460 : 28;
  const cx = tall ? W / 2 : 775;
  const refY = tall ? 628 : 214;
  const stub = (
    <>
      {paid ? (
        <QrBlock value={paid.reference} x={qx} y={qy} size={qrSize} />
      ) : (
        <FakeQr seed={item.key} x={qx} y={qy} size={qrSize} />
      )}
      {paid ? (
        <>
          <text x={cx} y={refY} textAnchor="middle" fill={NAVY} fontSize={tall ? 15 : 14} fontWeight="800" letterSpacing="0.6">
            {paid.reference}
          </text>
          <text x={cx} y={refY + (tall ? 20 : 18)} textAnchor="middle" fill="#788394" fontSize="11" fontWeight="600">
            Scan at boarding or entry
          </text>
        </>
      ) : (
        <text x={cx} y={refY} textAnchor="middle" fill="#788394" fontSize="11" fontWeight="600">
          Your QR code unlocks after payment
        </text>
      )}
      {!tall && (
        <>
          <line x1="680" y1="244" x2="870" y2="244" stroke={NAVY} strokeOpacity="0.14" strokeDasharray="3 5" />
          <text x="680" y="264" fill="#788394" fontSize="11" fontWeight="600">
            {priceLabel}
          </text>
          <text x="680" y="288" fill={NAVY} fontSize={priceValue.length > 12 ? 20 : 24} fontWeight="800" letterSpacing="-0.6">
            {priceValue}
          </text>
        </>
      )}
    </>
  );

  return (
    <svg
      className={`lum-ticket-svg${tall ? " is-tall" : ""}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      data-ticket-width={W}
      data-ticket-height={H}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={NAVY} />
          <stop offset="1" stopColor={NAVY_LIGHT} />
        </linearGradient>
        <mask id={`${uid}-cut`}>
          <rect width={W} height={H} rx="22" fill="#fff" />
          {tall ? (
            <>
              <circle cx="0" cy={SPLIT} r="15" fill="#000" />
              <circle cx={W} cy={SPLIT} r="15" fill="#000" />
            </>
          ) : (
            <>
              <circle cx={SPLIT} cy="0" r="15" fill="#000" />
              <circle cx={SPLIT} cy={H} r="15" fill="#000" />
            </>
          )}
        </mask>
        <clipPath id={`${uid}-stub`}>
          {tall ? <rect x="0" y={SPLIT} width={W} height={H - SPLIT} /> : <rect x={SPLIT} y="0" width={W - SPLIT} height={H} />}
        </clipPath>
      </defs>

      <g mask={`url(#${uid}-cut)`}>
        <rect width={W} height={H} fill={`url(#${uid}-bg)`} />
        <circle cx="0" cy="0" r={tall ? 52 : 58} fill={GOLD} />
        {!tall && <circle cx="610" cy={H} r="40" fill={GOLD_LIGHT} opacity="0.95" />}
        <circle cx={tall ? 250 : 560} cy={tall ? 200 : 150} r="150" fill="none" stroke={GOLD} strokeOpacity="0.14" strokeWidth="1.5" />
        <circle cx={tall ? 250 : 560} cy={tall ? 200 : 150} r="108" fill="none" stroke={GOLD} strokeOpacity="0.1" strokeWidth="1.5" />
        <g clipPath={`url(#${uid}-stub)`}>
          <rect width={W} height={H} fill={CREAM} />
        </g>
      </g>

      {tall ? (
        <line x1="24" y1={SPLIT} x2={W - 24} y2={SPLIT} stroke={GOLD} strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
      ) : (
        <line x1={SPLIT} y1="24" x2={SPLIT} y2={H - 24} stroke={GOLD} strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
      )}

      {body}
      {stub}
    </svg>
  );
}
