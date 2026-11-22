import Marketplace from "@/components/Marketplace";
import SiteNav from "@/components/SiteNav";

export default function TicketsPage() {
  return (
    <main className="lum-page">
      <SiteNav />

      <section className="lum-experiences" id="tickets">
        <div className="lum-section-heading">
          <div>
            <div className="lum-eyebrow">
              <span className="lum-eyebrow-dot" />
              GET YOURS TODAY
            </div>
            <h1>
              Latest <span>tickets</span>
            </h1>
            <p>Browse current events and bus routes, then book securely online.</p>
          </div>
        </div>

        <Marketplace />
      </section>
    </main>
  );
}