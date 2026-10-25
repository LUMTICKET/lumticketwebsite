"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  CreditCard,
  Globe2,
  Package,
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  Truck,
  WifiOff,
} from "lucide-react";
import TicketHero3D from "@/components/TicketHero3D";
import Marketplace from "@/components/Marketplace";
import SiteNav from "@/components/SiteNav";

const howItWorksSteps = [
  {
    number: "01",
    title: "Search & Compare",
    description:
      "Compare bus operators, schedules, parcel rates, and event tickets side by side with live seat availability across SADC.",
  },
  {
    number: "02",
    title: "Book & Pay Your Way",
    description:
      "Pay securely using mobile money (EcoCash, Airtel, M-Pesa), bank cards, or reserve and pay at authorized retail agents.",
  },
  {
    number: "03",
    title: "Instant QR Pass",
    description:
      "A secure, forgery-proof QR pass drops straight into your wallet—ready to use online or offline without internet.",
  },
  {
    number: "04",
    title: "Travel, Attend & Track",
    description:
      "Scan in instantly at bus boarding or venue entry, and track your parcel movements in real time until delivered.",
  },
];

const platformGuarantees = [
  {
    icon: QrCode,
    title: "Secure QR Tickets",
    description:
      "Every ticket is uniquely encrypted and validated on scan—forgery-resistant and strictly single-use.",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    description:
      "Gate scanners and bus driver apps validate tickets offline in remote terminals, syncing when reconnected.",
  },
  {
    icon: ShieldCheck,
    title: "Licensed Payments",
    description:
      "Processed through licensed payment gateways and official telco mobile money—funds go directly to operators.",
  },
  {
    icon: Globe2,
    title: "Built for SADC",
    description:
      "Multi-currency support (USD, ZAR, ZMW, MWK) tailored for cross-border transit across Southern Africa.",
  },
];

export default function HomePage() {
  return (
    <main className="lum-page">
      {/* --- NAVIGATION BAR --- */}
      <SiteNav />

      {/* --- LIVE TICKETS: events, buses & travel from the Lumticket API --- */}
      <section className="lum-experiences" id="tickets">
        <div className="lum-section-heading">
          <div>
            <div className="lum-eyebrow">
              <span className="lum-eyebrow-dot" />
              TICKETS ON SALE NOW
            </div>
            <h2>
              Find your <span>ticket</span>
            </h2>
            <p>Pick an event or bus trip and check out as a guest or with your account.</p>
          </div>
          <a href="https://business.lumticket.com" className="lum-button-outline">
            Start a Business <ArrowUpRight size={16} />
          </a>
        </div>

        <Marketplace />
      </section>

      {/* --- TRUST & PLATFORM GUARANTEES --- */}
      <section className="lum-guarantees">
        <div className="lum-guarantees-grid">
          {platformGuarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div className="lum-guarantee-card" key={idx}>
                <div className="lum-guarantee-icon">
                  <Icon size={24} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="lum-how-it-works" id="how-it-works">
        <div className="lum-section-heading centered">
          <div className="lum-eyebrow">
            <span className="lum-eyebrow-dot" />
            SIMPLE & SEAMLESS
          </div>
          <h2>
            How <span>Lumticket</span> works
          </h2>
          <p>Four effortless steps from searching your trip to arriving at your destination.</p>
        </div>

        <div className="lum-steps-grid">
          {howItWorksSteps.map((step) => (
            <div className="lum-step-card" key={step.number}>
              <div className="lum-step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- BUSINESS ONBOARDING / OPERATOR CTA --- */}
      <section className="lum-business-cta" id="business">
        <div className="lum-business-container">
          <div className="lum-business-copy">
            <div className="lum-eyebrow light">
              <span className="lum-eyebrow-dot" />
              PARTNER WITH LUMTICKET
            </div>
            <h2>
              Grow your business on <span>Lumticket</span>
            </h2>
            <p>
              Join licensed bus operators, courier companies, venue organizers, and retail ticketing agents across the SADC region.
            </p>

            <ul className="lum-business-bullets">
              <li>
                <CheckCircle2 size={18} />
                <span><strong>Instant Inventory Sync:</strong> Real-time seat allocation, station manifests, and ticket holds.</span>
              </li>
              <li>
                <CheckCircle2 size={18} />
                <span><strong>Fraud Protection:</strong> Encrypted QR code validation app works seamlessly offline.</span>
              </li>
              <li>
                <CheckCircle2 size={18} />
                <span><strong>Verified Partner Network:</strong> Fast KYC onboarding protects platform integrity for everyone.</span>
              </li>
            </ul>

            <div className="lum-business-actions">
              <a href="https://business.lumticket.com" className="lum-button-gold-lg">
                <Building2 size={20} />
                <span>Start a Business</span>
              </a>
              <a href="/tickets" className="lum-button-outline-light">
                <Ticket size={18} />
                <span>Buy Tickets Instead</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="lum-footer">
        <div className="lum-footer-main">
          <a href="#" className="lum-logo">
            <span className="lum-logo-icon">
              <Ticket size={20} />
            </span>
            <span>
              lum<span className="lum-gold">ticket</span>
            </span>
          </a>
          <p>The unified engine for bus travel, parcel freight, and events across SADC.</p>
        </div>
        <div className="lum-footer-bottom">
          <span className="lum-copyright">
            © {new Date().getFullYear()} Lumticket Technologies. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  );
}
