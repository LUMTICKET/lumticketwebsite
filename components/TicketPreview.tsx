"use client";

import { useEffect } from "react";
import { ArrowRight, MousePointerClick, X } from "lucide-react";
import { formatMoney, type Listing } from "@/lib/api";
import { TicketSVG } from "@/components/TicketArt";

const STATUS_LABEL: Record<string, string> = {
  "on-sale": "On sale",
  "selling-fast": "Selling fast",
  "sold-out": "Sold out",
};

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
