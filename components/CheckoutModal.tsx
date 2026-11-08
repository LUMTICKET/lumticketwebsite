"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, Minus, Plus, X } from "lucide-react";
import PaidTicket, { type VerifyState } from "@/components/PaidTicket";
import {
  ApiError,
  formatMoney,
  getSession,
  resendTwoFactor,
  sendTicketEmail,
  signIn,
  signUp,
  startGuestSession,
  startTicketCheckout,
  verifyTwoFactor,
  waitForTicket,
  type Listing,
  type PayMethod,
} from "@/lib/api";

type Mode = "guest" | "signin" | "signup";
type Step = "form" | "code" | "success";

interface Receipt {
  reference: string;
  emailed: boolean;
  email: string;
  total: string;
  when: string;
  quantity: number;
  holder?: string;
}

const MAX_QTY_CAP = 10;

function formatWhen(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: iso.length > 10 ? "short" : undefined });
}

export default function CheckoutModal({ item, onClose }: { item: Listing; onClose: () => void }) {
  const MAX_QTY = Math.min(MAX_QTY_CAP, item.maxPerUser ?? MAX_QTY_CAP);
  const [mode, setMode] = useState<Mode>("guest");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState(() => getSession()?.email ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [challenge, setChallenge] = useState<{ token: string; masked?: string } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [verify, setVerify] = useState<VerifyState>("checking");
  const [bookingStatus, setBookingStatus] = useState<string | undefined>();
  const [tierIdx, setTierIdx] = useState(0);
  const [method, setMethod] = useState<PayMethod>("tnm");
  const [payPhone, setPayPhone] = useState("");
  const [payNote, setPayNote] = useState("");
  const [cardUrl, setCardUrl] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  const tier = item.tiers?.[tierIdx];
  const unitPrice = tier?.price ?? item.fromPrice;
  const total = unitPrice * qty;
  const soldOut = item.status === "sold-out";
  const notBuyable = !item.tiers?.length;

  // Escape to close, lock page scroll while open, focus the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);


  async function completeBooking(customerEmail: string) {
    if (!tier) {
      throw new ApiError(400, "This listing can't be bought online yet. Please try another one.");
    }
    const phoneDigits = payPhone.trim();
    if (method !== "card" && !phoneDigits) throw new ApiError(400, "Enter your mobile money number.");

    // 1. Start the OneKhusa payment. The API prices the order itself from the ticket type.
    setPayNote(method === "card" ? "Opening secure card checkout…" : "Check your phone and approve the payment prompt…");
    const started = await startTicketCheckout({
      ticketTypeId: tier.id,
      quantity: qty,
      method,
      ...(method !== "card" ? { phone: phoneDigits } : {}),
    });
    if (method === "card") {
      if (!started.checkoutUrl) throw new ApiError(502, "Card checkout did not return a payment page.");
      setCardUrl(started.checkoutUrl);
      window.open(started.checkoutUrl, "_blank", "noopener");
      setPayNote("Complete the card payment in the new tab. We'll confirm it here automatically.");
    }

    // 2. Wait for the signed webhook; the API issues the booking once the payment has succeeded.
    const result = await waitForTicket(started.paymentId);
    if (result.outcome === "failed") {
      throw new ApiError(402, "The payment was declined or cancelled, so no ticket was issued.");
    }
    if (result.outcome === "sold-out") {
      throw new ApiError(409, `The last tickets sold out as you paid. Your payment (#${started.paymentId}) has been flagged for a refund.`);
    }
    if (result.outcome === "timeout") {
      throw new ApiError(408, `We haven't received payment confirmation yet. If money left your account, quote payment #${started.paymentId} to support.`);
    }
    const { reference } = result.booking;
    setPayNote("");

    const when = formatWhen(item.startsAt ?? result.booking.scheduledFor ?? "");
    const totalLabel = formatMoney(total, item.currency);
    const emailed = await sendTicketEmail({
      email: customerEmail,
      reference,
      title: `${item.title} — ${tier.name}`,
      when,
      quantity: qty,
      total: totalLabel,
    });
    setReceipt({
      reference,
      emailed,
      email: customerEmail,
      total: totalLabel,
      when,
      quantity: qty,
      holder: name.trim() || undefined,
    });
    setVerify("ok"); // the reference comes straight from the API's booking record
    setBookingStatus(result.booking.status);
    setStep("success");
  }

  function fail(err: unknown, duringAuth = false) {
    if (err instanceof ApiError) {
      // 409 while creating the account means the email exists; 409 from checkout means sold out.
      if (duringAuth && err.status === 409 && mode !== "signin") {
        setMode("signin");
        setError("That email already has a Lumticket account. Sign in with your password to continue.");
        return;
      }
      setPayNote("");
      setCardUrl("");
      setError(err.message);
    } else {
      setPayNote("");
      setError("Something went wrong. Check your connection and try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    let authed = false;
    try {
      if (mode === "signin") {
        const res = await signIn(email.trim(), password);
        if (res.status === "needs2FA") {
          setChallenge({ token: res.challengeToken, masked: res.maskedDestination });
          setStep("code");
          return;
        }
      } else if (mode === "signup") {
        await signUp({ email: email.trim(), password, name: name.trim(), phone: phone.trim() });
      } else {
        await startGuestSession({ email: email.trim(), name: name.trim(), phone: phone.trim() });
      }
      authed = true;
      await completeBooking(email.trim());
    } catch (err) {
      fail(err, !authed);
    } finally {
      setBusy(false);
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError("");
    setBusy(true);
    try {
      await verifyTwoFactor(challenge.token, code.trim(), email.trim());
      await completeBooking(email.trim());
    } catch (err) {
      if (err instanceof ApiError && (err.status === 410 || err.status === 429)) {
        setStep("form");
        setChallenge(null);
        setCode("");
      }
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!challenge) return;
    setError("");
    try {
      await resendTwoFactor(challenge.token);
      setNotice("A new code is on its way.");
    } catch (err) {
      fail(err);
    }
  }

  const emailField = (
    <label className="lum-field">
      <span>Email {mode === "guest" && <em>— your ticket is sent here</em>}</span>
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
    </label>
  );

  return (
    <div className="lum-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`lum-modal${step === "success" ? " lum-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Buy ${item.title}`}
        tabIndex={-1}
        ref={dialogRef}
      >
        <button className="lum-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {step === "success" && receipt ? (
          <>
            <PaidTicket
              item={item}
              paid={{
                reference: receipt.reference,
                quantity: receipt.quantity,
                total: receipt.total,
                when: receipt.when,
                holder: receipt.holder,
              }}
              email={receipt.email}
              emailed={receipt.emailed}
              verify={verify}
              status={bookingStatus}
            />
            <button type="button" className="lum-button-gold lum-submit lum-paid-done" onClick={onClose}>
              <span>Done</span>
            </button>
          </>
        ) : (
          <>
            <header className="lum-modal-head">
              <span className="lum-card-category">{item.group}</span>
              <h3>{item.title}</h3>
              <p>
                {[item.operator ?? item.subtitle, item.place, item.startsAt && formatWhen(item.startsAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </header>

            {soldOut ? (
              <p className="lum-form-error">This one is sold out.</p>
            ) : notBuyable ? (
              <p className="lum-form-error">Online booking for this listing isn&apos;t available yet.</p>
            ) : step === "code" ? (
              <form onSubmit={handleCode} className="lum-form">
                <p className="lum-form-hint">
                  <Mail size={15} /> Enter the 6-digit code sent to {challenge?.masked ?? "your email"}.
                </p>
                <label className="lum-field">
                  <span>Verification code</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                  />
                </label>
                {error && <p className="lum-form-error" role="alert">{error}</p>}
                {notice && <p className="lum-form-notice" role="status">{notice}</p>}
                {payNote && <p className="lum-form-notice" role="status">{payNote}</p>}
                <button className="lum-button-gold lum-submit" disabled={busy || code.length !== 6}>
                  {busy ? <Loader2 className="lum-spin" size={16} /> : null}
                  <span>Verify & pay · {formatMoney(total, item.currency)}</span>
                </button>
                <button type="button" className="lum-link-button" onClick={handleResend}>
                  Resend code
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="lum-form">
                <div className="lum-mode-tabs" role="tablist" aria-label="Checkout method">
                  {(
                    [
                      ["guest", "Continue as guest"],
                      ["signin", "Sign in"],
                      ["signup", "Create account"],
                    ] as const
                  ).map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={mode === m}
                      className={mode === m ? "active" : ""}
                      onClick={() => {
                        setMode(m);
                        setError("");
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="lum-qty-row">
                  <div>
                    <strong>Tickets</strong>
                    <small>{formatMoney(unitPrice, item.currency)} each</small>
                  </div>
                  <div className="lum-stepper">
                    <button
                      type="button"
                      aria-label="Fewer tickets"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                    >
                      <Minus size={15} />
                    </button>
                    <span aria-live="polite">{qty}</span>
                    <button
                      type="button"
                      aria-label="More tickets"
                      onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                      disabled={qty >= MAX_QTY}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {item.tiers && item.tiers.length > 0 && (
                  <label className="lum-field">
                    <span>Ticket type</span>
                    <select value={tierIdx} onChange={(e) => setTierIdx(Number(e.target.value))}>
                      {item.tiers.map((t, i) => (
                        <option key={t.name} value={i}>
                          {t.name} — {formatMoney(t.price, t.currency)}
                          {t.remaining !== undefined ? ` (${t.remaining} left)` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {emailField}

                {mode !== "signin" && (
                  <div className="lum-field-row">
                    <label className="lum-field">
                      <span>Full name</span>
                      <input
                        autoComplete="name"
                        required={mode === "signup"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                    </label>
                    <label className="lum-field">
                      <span>Phone <em>(optional)</em></span>
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+265…"
                      />
                    </label>
                  </div>
                )}

                {mode !== "guest" && (
                  <label className="lum-field">
                    <span>Password</span>
                    <input
                      type="password"
                      required
                      minLength={mode === "signup" ? 8 : undefined}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    />
                  </label>
                )}

                <label className="lum-field">
                  <span>Pay with</span>
                  <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
                    <option value="tnm">TNM Mpamba</option>
                    <option value="airtel">Airtel Money</option>
                    <option value="card">Bank card</option>
                  </select>
                </label>
                {method !== "card" && (
                  <label className="lum-field">
                    <span>Mobile money number <em>— you&apos;ll get a PIN prompt</em></span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={payPhone}
                      onChange={(e) => setPayPhone(e.target.value)}
                      placeholder="0999 000 000"
                    />
                  </label>
                )}

                {error && <p className="lum-form-error" role="alert">{error}</p>}
                {payNote && <p className="lum-form-notice" role="status">{payNote}</p>}
                {cardUrl && busy && (
                  <a className="lum-link-button" href={cardUrl} target="_blank" rel="noopener noreferrer">
                    Card page didn&apos;t open? Click here
                  </a>
                )}

                <button className="lum-button-gold lum-submit" disabled={busy}>
                  {busy ? <Loader2 className="lum-spin" size={16} /> : null}
                  <span>
                    {busy ? "Processing…" : `Pay ${formatMoney(total, item.currency)}`}
                  </span>
                </button>
                <p className="lum-form-fineprint">
                  {mode === "guest"
                    ? "No password needed. We email your ticket and show your reference right away."
                    : "Your tickets stay linked to your account."}
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
