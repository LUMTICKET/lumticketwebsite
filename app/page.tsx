"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  CreditCard,
  Globe2,
  Menu,
  Package,
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  Truck,
  WifiOff,
  X,
} from "lucide-react";
import TicketHero3D from "@/components/TicketHero3D";

const experiences = [
  {
    category: "Bus Travel",
    number: "01",
    title: "Cross-Border Intercity Routes",
    description:
      "Direct intercity and cross-border bus travel across South Africa, Zimbabwe, Zambia, and Malawi with live seat maps.",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=85",
    tag: "Book Bus Seats",
  },
  {
    category: "Parcel Freight",
    number: "02",
    title: "Station-to-Station Delivery",
    description:
      "Send parcels quickly across SADC using established bus freight networks with real-time SMS waybill tracking.",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=85",
    tag: "Ship a Parcel",
  },
  {
    category: "Live Events",
    number: "03",
    title: "Concerts, Sports & Festivals",
    description:
      "Discover headline concerts, regional sports matches, and cultural festivals with instant digital gate access.",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=85",
    tag: "Get Event Passes",
  },
];

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

const categories = ["All", "Bus Travel", "Parcel Freight", "Live Events"];

export default function HomePage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = experiences.filter((item) => {
    const matchesCategory =
      category === "All" || item.category === category;
    const term = search.toLowerCase();
    return (
      matchesCategory &&
      (item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term))
    );
  });

  return (
    <main className="lum-page">
      {/* --- NAVIGATION BAR --- */}
      <nav className="lum-nav">
        <a href="#" className="lum-logo" aria-label="Lumticket home">
          <span className="lum-logo-icon">
            <Ticket size={21} strokeWidth={1.8} />
          </span>
          <span>
            lum<span className="lum-gold">ticket</span>
          </span>
        </a>

        <div
          id="primary-navigation"
          className={`lum-nav-links ${menuOpen ? "is-open" : ""}`}
        >
          <a href="#discover" onClick={() => setMenuOpen(false)}>
            Discover
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How It Works
          </a>
          <a href="https://business.lumticket.com/events" onClick={() => setMenuOpen(false)}>
            Services
          </a>
          <a href="https://business.lumticket.com/signup" onClick={() => setMenuOpen(false)}>
            For Businesses
          </a>
        </div>

        <div className="lum-nav-actions">
          {/* Main Action Buttons */}
          <a href="https://business.lumticket.com" className="lum-button-primary-sm">
            <Ticket size={16} />
            <span>Buy Tickets</span>
          </a>
          <a href="#business" className="lum-button-outline-sm">
            <Building2 size={16} />
            <span>Partner With Us</span>
          </a>

          <button
            className="lum-menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="lum-hero" id="discover">
        <div className="lum-hero-copy">
          <div className="lum-eyebrow">
            <span className="lum-eyebrow-dot" />
            ONE PLATFORM FOR SADC TRAVEL, PARCELS & EVENTS
          </div>

          <h1>
            Travel further,
            <br />
            <span>ship faster & experience more.</span>
          </h1>

          <p className="lum-hero-description">
            Book intercity buses, send tracked parcel freight, and get secure
            event tickets across Southern Africa—all backed by instant offline QR
            validation and verified mobile money payments.
          </p>

          {/* Core Conversion Buttons */}
          <div className="lum-hero-actions">
            <a href="https://business.lumticket.com" className="lum-button-primary">
              <Ticket size={18} />
              <span>Buy Tickets & Travel</span>
            </a>
            <a href="https://business.lumticket.com/signup" className="lum-button-gold">
              <Building2 size={18} />
              <span>Get Started with Your Ticketing Business</span>
            </a>
          </div>

          <div className="lum-hero-note">
            <span className="lum-note-icon">
              <ShieldCheck size={18} />
            </span>
            <span>
              <strong>Licensed & Trusted Regional Network</strong>
              <small>
                Secure mobile money, multi-currency checkout, and instant QR verification.
              </small>
            </span>
          </div>
        </div>

        <div className="lum-hero-visual">

          <TicketHero3D />

          <div className="lum-floating-note">
            <span className="lum-floating-icon">
              <QrCode size={18} />
            </span>
            <span>
              <strong>Digital Boarding Pass</strong>
              <small>Offline-ready QR ticket generated instantly</small>
            </span>
            <ArrowUpRight size={17} />
          </div>
        </div>
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

      {/* --- DISCOVERY & SEARCH SECTION --- */}
      <section className="lum-experiences" id="experiences">
        <div className="lum-section-heading">
          <div>
            <div className="lum-eyebrow">
              <span className="lum-eyebrow-dot" />
              EXPLORE SADC SERVICES
            </div>
            <h2>
              Ready to <span>get moving?</span>
            </h2>
            <p>Select your category, pick your route or event, and reserve your ticket in seconds.</p>
          </div>
          <a href="https://business.lumticket.com/signup" className="lum-button-outline">
            Sell Tickets On Lumticket <ArrowUpRight size={16} />
          </a>
        </div>

        <div className="lum-discovery-tools">
          <div className="lum-category-tabs">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "active" : ""}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="lum-experience-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routes, events, or courier services..."
              aria-label="Search routes, events, or courier services"
            />
          </label>
        </div>

        <div className="lum-experience-grid">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <article className="lum-experience-card" key={item.number}>
                <div
                  className="lum-card-image"
                  style={{ backgroundImage: `url("${item.image}")` }}
                >
                  <span className="lum-card-number">{item.number} / 03</span>
                </div>

                <div className="lum-card-copy">
                  <span className="lum-card-category">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <a href="https://business.lumticket.com" className="lum-button-primary-card">
                    <span>{item.tag}</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </article>
            ))
          ) : (
            <p className="lum-empty-state" role="status">
              No services match your search. Try another keyword or category.
            </p>
          )}
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
              <a href="https://business.lumticket.com/signup" className="lum-button-gold-lg">
                <Building2 size={20} />
                <span>Get Started with Your Ticketing Business</span>
              </a>
              <a href="https://business.lumticket.com" className="lum-button-outline-light">
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