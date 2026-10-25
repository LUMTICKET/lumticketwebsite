import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { email, reference, title, when, quantity, total } = body ?? {};

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof reference !== "string" ||
    typeof title !== "string"
  ) {
    return NextResponse.json({ sent: false, error: "Invalid ticket details" }, { status: 400 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE, FROM_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    // Email not configured: checkout still succeeded, the UI shows the reference instead.
    return NextResponse.json({ sent: false, error: "Email delivery is not configured" });
  }

  const port = Number(SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  const rows = [
    ["Reference", reference],
    ["Ticket", title],
    ["When", String(when ?? "")],
    ["Quantity", String(quantity ?? 1)],
    ["Total", String(total ?? "")],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#788394">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`,
    )
    .join("");

  try {
    await transporter.sendMail({
      from: FROM_EMAIL ?? SMTP_USER,
      to: email,
      subject: `Your Lumticket ticket ${reference}`,
      text: `Your booking is confirmed.\n\nReference: ${reference}\nTicket: ${title}\nWhen: ${when}\nQuantity: ${quantity}\nTotal: ${total}\n\nShow this reference at boarding or entry.`,
      html: `<div style="font-family:Arial,sans-serif;color:#042045;max-width:480px">
        <h2 style="margin:0 0 4px">Your ticket is confirmed ✓</h2>
        <p style="color:#788394;margin:0 0 18px">Show this reference at boarding or entry.</p>
        <table style="border-collapse:collapse;font-size:14px">${rows}</table>
        <p style="margin-top:22px;font-size:12px;color:#788394">Lumticket — bus, parcels &amp; event tickets across SADC.</p>
      </div>`,
    });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ sent: false, error: "Could not send email" });
  }
}
