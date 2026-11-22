"use client";

import { useState } from "react";
import { Building2, Menu, Ticket, X } from "lucide-react";

export default function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="lum-nav">
      <a href="/" className="lum-logo" aria-label="Lumticket home">
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
        <a href="/#discover" onClick={() => setMenuOpen(false)}>
          Discover
        </a>
        <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>
          How It Works
        </a>
        <a href="/tickets" onClick={() => setMenuOpen(false)}>
          Tickets
        </a>
        <a href="https://business.lumticket.com" onClick={() => setMenuOpen(false)}>
          For Businesses
        </a>
      </div>

      <div className="lum-nav-actions">
        <a href="/tickets" className="lum-button-primary-sm">
          <Ticket size={16} />
          <span>Buy Tickets</span>
        </a>
        <a href="https://business.lumticket.com" className="lum-button-outline-sm">
          <Building2 size={16} />
          <span>Start a Business</span>
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
  );
}