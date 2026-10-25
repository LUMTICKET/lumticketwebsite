// Lumticket API client for the customer-facing site.
// All calls go through the /lum-api proxy defined in next.config.ts (no CORS issues).

export const API_BASE = "/lum-api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/* ---------------------------------- session --------------------------------- */

const SESSION_KEY = "lum_customer_session";

export interface CustomerSession {
  token: string;
  refreshToken?: string;
  email?: string;
}

export function getSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: CustomerSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — session lives only for this call chain */
  }
}

/* --------------------------------- transport -------------------------------- */

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, payload?.error ?? `Request failed (${res.status})`);
  }
  return payload as T;
}

/* ---------------------------------- catalog --------------------------------- */

export type ListingKind = "event" | "bus";

/** One buyable thing — an event, a bus route, or an operator-published bus/flight/tourism product. */
export interface Listing {
  key: string;
  kind: ListingKind; // maps to the booking `kind` the API accepts
  group: "Events" | "Buses" | "Travel & Tourism";
  title: string;
  subtitle?: string;
  operator?: string;
  place?: string;
  startsAt?: string; // fixed date/time (events); undefined => customer picks a travel date
  fromPrice: number;
  currency: string;
  status: string;
  meta: string[]; // small facts shown on the card (duration, rating, departures...)
}

type Raw = Record<string, unknown>;

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;
const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

function toArray(data: unknown, ...keys: string[]): Raw[] {
  if (Array.isArray(data)) return data as Raw[];
  if (data && typeof data === "object") {
    for (const k of [...keys, "data", "items", "results"]) {
      const v = (data as Raw)[k];
      if (Array.isArray(v)) return v as Raw[];
    }
  }
  return [];
}

function normalizeEvent(e: Raw): Listing {
  const category = (str(e.category) ?? "event").toLowerCase();
  const isBus = category === "bus";
  const group = isBus ? "Buses" : category === "event" ? "Events" : "Travel & Tourism";
  const meta: string[] = [];
  const organizer = str(e.organizer);
  if (organizer) meta.push(organizer);
  return {
    key: `event-${e.id}`,
    kind: isBus ? "bus" : "event",
    group,
    title: str(e.title) ?? "Untitled",
    subtitle: str(e.subtitle),
    operator: organizer,
    place: str(e.location),
    startsAt: str(e.startsAt),
    fromPrice: num(e.fromPrice) ?? 0,
    currency: str(e.currency) ?? "MWK",
    status: str(e.status) ?? "on-sale",
    meta,
  };
}

function normalizeRoute(r: Raw): Listing {
  const origin = str(r.origin) ?? "";
  const destination = str(r.destination) ?? "";
  const operator = str(r.businessName) ?? str(r.operator) ?? str(r.operatorName);
  const meta: string[] = [];
  const duration = str(r.duration) ?? (num(r.durationMinutes) ? `${Math.round(num(r.durationMinutes)! / 60)}h` : undefined);
  if (duration) meta.push(duration);
  const perDay = num(r.departuresPerDay);
  if (perDay) meta.push(`${perDay} departures/day`);
  const rating = num(r.rating);
  if (rating) meta.push(`★ ${rating.toFixed(1)}`);
  return {
    key: `route-${r.id ?? `${origin}-${destination}-${operator}`}`,
    kind: "bus",
    group: "Buses",
    title: origin && destination ? `${origin} → ${destination}` : (str(r.title) ?? "Bus route"),
    subtitle: operator,
    operator,
    place: origin ? `Departs ${origin}` : undefined,
    startsAt: undefined,
    fromPrice: num(r.fromPrice) ?? 0,
    currency: str(r.currency) ?? "MWK",
    status: str(r.status) ?? "on-sale",
    meta,
  };
}

export async function fetchEvents(): Promise<Listing[]> {
  const data = await request<unknown>("/api/catalog/events");
  return toArray(data, "events").map(normalizeEvent);
}

export async function fetchRoutes(): Promise<Listing[]> {
  const data = await request<unknown>("/api/catalog/routes");
  return toArray(data, "routes").map(normalizeRoute);
}

/* ----------------------------------- auth ----------------------------------- */

export type SignInResult =
  | { status: "authenticated" }
  | { status: "needs2FA"; challengeToken: string; maskedDestination?: string };

export async function signIn(identifier: string, password: string): Promise<SignInResult> {
  const data = await request<Raw>("/api/auth/login", {
    method: "POST",
    body: { identifier, password },
  });
  if (data.requires2FA) {
    return {
      status: "needs2FA",
      challengeToken: String(data.challengeToken),
      maskedDestination: str(data.maskedDestination),
    };
  }
  setSession({
    token: String(data.token),
    refreshToken: str(data.refreshToken),
    email: identifier,
  });
  return { status: "authenticated" };
}

export async function verifyTwoFactor(challengeToken: string, code: string, email?: string) {
  const data = await request<Raw>("/api/auth/2fa", {
    method: "POST",
    body: { challengeToken, code },
  });
  setSession({ token: String(data.token), refreshToken: str(data.refreshToken), email });
}

export async function resendTwoFactor(challengeToken: string) {
  await request("/api/auth/2fa/resend", { method: "POST", body: { challengeToken } });
}

export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export async function signUp(input: SignUpInput) {
  const data = await request<Raw>("/api/auth/signup", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      ...(input.name ? { name: input.name } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
    },
  });
  setSession({ token: String(data.token), refreshToken: str(data.refreshToken), email: input.email });
}

/**
 * Guest checkout.
 *
 * The API has no anonymous-purchase endpoint yet (POST /api/bookings needs a bearer
 * token), so a guest is given a lightweight customer account behind the scenes using
 * their email and a random password. If the email already has an account the API
 * answers 409 and the UI asks them to sign in instead.
 *
 * When the backend adds a real guest endpoint, replace the body of this function —
 * nothing else in the UI needs to change.
 */
export async function startGuestSession(input: { email: string; name?: string; phone?: string }) {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const password = `Lm1!${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  await signUp({ ...input, password });
}

/* --------------------------------- bookings --------------------------------- */

export interface BookingInput {
  kind: ListingKind;
  title: string;
  scheduledFor: string; // ISO date-time
  amount: number; // total, minor units
  currency: string;
}

export interface BookingResult {
  reference: string;
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const session = getSession();
  if (!session) throw new ApiError(401, "Please sign in to continue.");
  const data = await request<Raw>("/api/bookings", {
    method: "POST",
    token: session.token,
    body: input,
  });
  const booking = (data.booking as Raw | undefined) ?? data;
  const reference = str(booking.reference) ?? str(data.reference);
  if (!reference) throw new ApiError(502, "Booking was created but no reference was returned.");
  return { reference };
}

export interface BookingRecord {
  reference: string;
  status?: string;
  title?: string;
  scheduledFor?: string;
  amount?: number;
}

/**
 * GET /api/bookings/:reference (owner only). Used right after checkout to confirm the API really
 * holds the booking whose reference is encoded in the ticket QR. Returns null if it can't be read.
 */
export async function fetchBooking(reference: string): Promise<BookingRecord | null> {
  const session = getSession();
  if (!session) return null;
  try {
    const data = await request<Raw>(`/api/bookings/${encodeURIComponent(reference)}`, { token: session.token });
    const b = (data.booking as Raw | undefined) ?? data;
    const ref = str(b.reference);
    if (!ref || ref.toLowerCase() !== reference.toLowerCase()) return null;
    return {
      reference: ref,
      status: str(b.status),
      title: str(b.title),
      scheduledFor: str(b.scheduledFor),
      amount: num(b.amount),
    };
  } catch {
    return null;
  }
}

/* ------------------------------- ticket email ------------------------------- */

export interface TicketEmail {
  email: string;
  reference: string;
  title: string;
  when: string;
  quantity: number;
  total: string;
}

export async function sendTicketEmail(ticket: TicketEmail): Promise<boolean> {
  try {
    const res = await fetch("/api/send-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    });
    const data = await res.json().catch(() => null);
    return res.ok && data?.sent === true;
  } catch {
    return false;
  }
}

/* --------------------------------- helpers ---------------------------------- */

export function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}
