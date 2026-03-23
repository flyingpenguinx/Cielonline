import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchServices } from "../lib/adminApi";
import {
  createBookingRequest,
  createPublicBookingCheckoutLink,
  fetchPublicSiteBySlug,
  fetchPublicSiteContent,
  trackSiteEvent,
} from "../lib/sitePlatformApi";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  vehicle_year: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_color: "",
  preferred_slot: "",
  service_name: "",
  notes: "",
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [site, setSite] = useState(null);
  const [content, setContent] = useState({});
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const publicSite = await fetchPublicSiteBySlug(slug);
        const [siteContent, siteServices] = await Promise.all([
          fetchPublicSiteContent(publicSite.id),
          fetchServices(publicSite.id),
        ]);

        if (!active) return;
        setSite(publicSite);
        setContent(siteContent);
        setServices(siteServices.filter((service) => service.is_active !== false && service.booking_enabled !== false));

        try {
          await trackSiteEvent({
            site_id: publicSite.id,
            event_type: "page_view",
            event_name: "booking_page_view",
            metadata: { slug },
          });
        } catch (trackingError) {
          console.error(trackingError);
        }
      } catch (loadError) {
        console.error(loadError);
        if (active) setError("Unable to load this booking page.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const selectedService = useMemo(
    () => services.find((service) => service.name === form.service_name) || null,
    [services, form.service_name]
  );

  const bookingTitle = selectedService?.name || `Appointment request for ${site?.site_name || "your business"}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!site || !form.first_name || !form.last_name || !form.email || !form.preferred_slot || !form.service_name) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await createBookingRequest({
        siteId: site.id,
        customer: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          vehicle_year: form.vehicle_year ? Number(form.vehicle_year) : null,
          vehicle_make: form.vehicle_make,
          vehicle_model: form.vehicle_model,
          vehicle_color: form.vehicle_color,
        },
        appointment: {
          title: bookingTitle,
          service_name: form.service_name,
          scheduled_at: new Date(form.preferred_slot).toISOString(),
          duration_minutes: selectedService?.duration_minutes || 60,
          notes: form.notes,
          status: "requested",
        },
        depositAmount: selectedService?.deposit_amount || 0,
        checkoutUrl: content["business.payment_url"] || null,
      });

      let checkoutUrl = null;
      const hasPaymentProvider = site.settings?.square_connected || site.settings?.stripe_account_id;
      if (result.payment && hasPaymentProvider) {
        const provider = site.settings?.square_connected ? "square" : "stripe";
        try {
          const checkout = await createPublicBookingCheckoutLink(site.id, result.payment.id, provider, {
            successUrl: `${window.location.origin}/book/${slug}?payment=success`,
            cancelUrl: `${window.location.origin}/book/${slug}?payment=cancelled`,
          });
          checkoutUrl = checkout.url || null;
        } catch (checkoutError) {
          console.error(checkoutError);
        }
      }

      setSubmitted({ ...result, checkoutUrl });
      setForm({ ...EMPTY_FORM });

      try {
        await trackSiteEvent({
          site_id: site.id,
          event_type: "conversion",
          event_name: "booking_request_submitted",
          metadata: {
            service_name: form.service_name,
            deposit_amount: selectedService?.deposit_amount || 0,
          },
        });
      } catch (trackingError) {
        console.error(trackingError);
      }
    } catch (submitError) {
      console.error(submitError);
      setError("Unable to submit your booking request right now. Please call or email the business directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="container main-space fade-in">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Loading booking page...</span>
        </div>
      </main>
    );
  }

  if (!site) {
    return (
      <main className="container main-space fade-in">
        <section className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2>Booking page unavailable</h2>
          <p className="muted">{error || "This booking portal is not configured yet."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container main-space fade-in">
      <section className="panel booking-page-shell">
        <div className="booking-page-header">
          <div>
            <p className="muted">Powered by Cielonline</p>
            <h1>{site.site_name}</h1>
            <p className="booking-page-intro">
              {content["home.contact.subtitle"] || "Pick a service, request a time, and the business can confirm everything from the admin dashboard."}
            </p>
          </div>
          <div className="booking-page-contact">
            {content["business.phone"] && <a href={`tel:${content["business.phone"]}`}>{content["business.phone"]}</a>}
            {content["business.email"] && <a href={`mailto:${content["business.email"]}`}>{content["business.email"]}</a>}
          </div>
        </div>

        {submitted ? (
          <div className="booking-success panel">
            <h2>Request received</h2>
            <p>
              {submitted.customer.first_name}, your appointment request is in the system. The admin can now see it in Cielonline and follow up from the CRM.
            </p>
            {submitted.payment ? (
              <p>
                Deposit recorded: {formatMoney(submitted.payment.amount)}.
                {submitted.checkoutUrl || submitted.payment.checkout_url ? " A payment link is ready." : " The business can send a payment link from the Payments tab."}
              </p>
            ) : (
              <p>No deposit was required for this request.</p>
            )}
            {(submitted.checkoutUrl || submitted.payment?.checkout_url) && (
              <div className="row-gap" style={{ marginTop: 16 }}>
                <a className="btn btn-primary" href={submitted.checkoutUrl || submitted.payment?.checkout_url} target="_blank" rel="noreferrer">
                  Pay Deposit
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="booking-page-grid">
            <form className="admin-form booking-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="field">
                  <span>First name *</span>
                  <input type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </label>
                <label className="field">
                  <span>Last name *</span>
                  <input type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </label>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Email *</span>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label className="field">
                  <span>Phone</span>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
              </div>

              <label className="field">
                <span>Service *</span>
                <select required value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })}>
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name} {service.price != null ? `· ${formatMoney(service.price)}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-grid">
                <label className="field">
                  <span>Preferred date & time *</span>
                  <input type="datetime-local" required value={form.preferred_slot} onChange={(e) => setForm({ ...form, preferred_slot: e.target.value })} />
                </label>
                <label className="field">
                  <span>Vehicle color</span>
                  <input type="text" value={form.vehicle_color} onChange={(e) => setForm({ ...form, vehicle_color: e.target.value })} />
                </label>
              </div>

              <div className="form-grid booking-vehicle-grid">
                <label className="field">
                  <span>Vehicle year</span>
                  <input type="number" min={1900} max={2100} value={form.vehicle_year} onChange={(e) => setForm({ ...form, vehicle_year: e.target.value })} />
                </label>
                <label className="field">
                  <span>Make</span>
                  <input type="text" value={form.vehicle_make} onChange={(e) => setForm({ ...form, vehicle_make: e.target.value })} />
                </label>
                <label className="field">
                  <span>Model</span>
                  <input type="text" value={form.vehicle_model} onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })} />
                </label>
              </div>

              <label className="field">
                <span>Notes</span>
                <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything the business should know before confirming the appointment" />
              </label>

              {error && <p className="status-banner">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Request Appointment"}
              </button>
            </form>

            <aside className="booking-summary panel">
              <h2>Booking summary</h2>
              {selectedService ? (
                <>
                  <div className="booking-summary-row">
                    <span>Service</span>
                    <strong>{selectedService.name}</strong>
                  </div>
                  {selectedService.price != null && (
                    <div className="booking-summary-row">
                      <span>Base price</span>
                      <strong>{formatMoney(selectedService.price)}</strong>
                    </div>
                  )}
                  <div className="booking-summary-row">
                    <span>Duration</span>
                    <strong>{selectedService.duration_minutes || 60} min</strong>
                  </div>
                  <div className="booking-summary-row">
                    <span>Deposit</span>
                    <strong>{selectedService.deposit_amount ? formatMoney(selectedService.deposit_amount) : "None"}</strong>
                  </div>
                  {selectedService.description && <p className="muted">{selectedService.description}</p>}
                </>
              ) : (
                <p className="muted">Choose a service to see its price, duration, and deposit requirement.</p>
              )}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}