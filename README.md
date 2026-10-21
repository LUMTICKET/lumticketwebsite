# Lumticket web

Next.js (App Router) + Tailwind v4 + Three.js. Brand tokens live in `app/globals.css`.

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

## Structure

- `app/` — pages: Home `/`, Business `/business`, Tickets `/tickets`, About `/about`, Contact `/contact`
- `components/layout` — Navbar (logo left + moving bus banner), Footer, Logo
- `components/ticket/TicketScene.tsx` — the Three.js ticket (drag to rotate, click to flip)
- `lib/ticketTexture.ts` — canvas artwork for the ticket faces
- `lib/data.ts` — routes, copy, partner roles (single source of content)

## Before going live

- Swap `components/layout/Logo.tsx` for the real logo in `public/brand/`.
- `app/api/contact/route.ts` validates only — connect it to email/helpdesk.
- Seat map in `SeatPicker.tsx` and routes in `lib/data.ts` are demo data; wire to the live API.
- Ticket QR codes/barcodes are decorative, not scannable.
