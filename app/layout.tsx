import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";


export const metadata: Metadata = {
  title: {
    default: "Lumticket — Bus, parcels & event tickets across SADC",
    template: "%s · Lumticket",
  },
  description:
    "One platform for bus travel, parcels, and event tickets across the SADC region. Live seat availability, secure QR tickets, and licensed payments.",
};

export const viewport: Viewport = {
  themeColor: "#042045",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-screen antialiased">
        <main id="main">{children}</main>
       
      </body>
    </html>
  );
}
