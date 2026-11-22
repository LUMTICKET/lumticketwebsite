"use client";

import { useRef, useState } from "react";
import { Copy, Download, Mail, Printer, Share2, ShieldCheck } from "lucide-react";
import type { Listing } from "@/lib/api";
import { TicketSVG, type PaidInfo } from "@/components/TicketArt";

export type VerifyState = "checking" | "ok" | "unknown";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Standalone copy of the on-screen SVG (fonts inlined so it renders outside the page). */
function serialize(svg: SVGSVGElement) {
  const w = Number(svg.dataset.ticketWidth) || 900;
  const h = Number(svg.dataset.ticketHeight) || 300;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const style = document.createElementNS(SVG_NS, "style");
  style.textContent = "text{font-family:Arial,Helvetica,sans-serif}";
  clone.insertBefore(style, clone.firstChild);
  return { xml: new XMLSerializer().serializeToString(clone), w, h };
}

async function svgToPng(svg: SVGSVGElement, scale = 3): Promise<Blob> {
  const { xml, w, h } = serialize(svg);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not render ticket"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"),
  );
}

export default function PaidTicket({
  item,
  paid,
  email,
  emailed,
  verify,
  status,
}: {
  item: Listing;
  paid: PaidInfo;
  email: string;
  emailed: boolean;
  verify: VerifyState;
  status?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const getSvg = () => wrapRef.current?.querySelector<SVGSVGElement>("svg.lum-ticket-svg") ?? null;
  const fileName = `lumticket-${paid.reference}.png`;
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.canShare === "function" && typeof navigator.share === "function";

  async function download() {
    const svg = getSvg();
    if (!svg) return;
    setBusy(true);
    setNote("");
    try {
      const blob = await svgToPng(svg);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setNote("Couldn't save the image. Take a screenshot of the ticket instead.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const svg = getSvg();
    if (!svg) return;
    setBusy(true);
    setNote("");
    try {
      const file = new File([await svgToPng(svg)], fileName, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${item.title} ticket`, text: `Ticket ${paid.reference}` });
      } else {
        await download();
      }
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") setNote("Couldn't share the ticket. Try Save image.");
    } finally {
      setBusy(false);
    }
  }

  function print() {
    const svg = getSvg();
    if (!svg) return;
    const { xml } = serialize(svg);
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    frame.srcdoc = `<!doctype html><html><head><title>Ticket ${paid.reference}</title><style>
      @page{margin:12mm}html,body{margin:0}body{display:grid;place-items:center;min-height:100vh}
      svg{width:100%;max-width:${svg.classList.contains("is-tall") ? "95mm" : "190mm"};height:auto}
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${xml}</body></html>`;
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1500);
    };
    document.body.appendChild(frame);
  }

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(paid.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="lum-paid">
      <div className="lum-paid-head">
        <h3>You&apos;re booked</h3>
        {verify === "ok" && (
          <span className="lum-verify is-ok">
            <ShieldCheck size={14} />
            Verified with Lumticket{status ? ` · ${status}` : ""}
          </span>
        )}
        {verify === "checking" && <span className="lum-verify">Confirming with Lumticket…</span>}
      </div>

      <div ref={wrapRef} className="lum-paid-ticket">
        <TicketSVG item={item} paid={paid} />
      </div>

      <p className="lum-paid-lead">
        {emailed ? (
          <>
            <Mail size={14} /> A copy was sent to <strong>{email}</strong>.
          </>
        ) : (
          <>Save this ticket now. Show the QR code at boarding or entry. Your reference works too if the code can&apos;t be scanned.</>
        )}
      </p>

      <div className="lum-paid-actions">
        <button type="button" className="lum-button-primary-sm" onClick={canShare ? share : download} disabled={busy}>
          {canShare ? <Share2 size={15} /> : <Download size={15} />}
          <span>{canShare ? "Save or share" : "Save image"}</span>
        </button>
        {canShare && (
          <button type="button" className="lum-button-outline-sm" onClick={download} disabled={busy}>
            <Download size={15} />
            <span>Save image</span>
          </button>
        )}
        <button type="button" className="lum-button-outline-sm" onClick={print}>
          <Printer size={15} />
          <span>Print</span>
        </button>
        <button type="button" className="lum-button-outline-sm" onClick={copyRef}>
          <Copy size={15} />
          <span>{copied ? "Copied" : "Copy reference"}</span>
        </button>
      </div>
      {note && (
        <p className="lum-form-error" role="alert">
          {note}
        </p>
      )}
    </div>
  );
}
