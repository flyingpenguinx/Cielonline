import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAppointments, fetchCustomers } from "../../lib/adminApi";
import {
  createSquareCheckoutLink,
  createSquareOAuthLink,
  createStripeCheckoutLink,
  createStripeConnectOnboardingLink,
  createPayment,
  deletePayment,
  fetchPayments,
  updatePayment,
} from "../../lib/sitePlatformApi";

const STATUS_OPTIONS = [
  "pending",
  "payment_link_sent",
  "paid",
  "failed",
  "refunded",
  "cancelled",
];

const EMPTY_FORM = {
  customer_id: "",
  appointment_id: "",
  label: "",
  amount: "",
  currency: "USD",
  status: "pending",
  payment_method: "",
  external_reference: "",
  checkout_url: "",
  due_at: "",
  paid_at: "",
  notes: "",
};

function formatMoney(amount, currency = "USD") {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PaymentsTab({ siteId, site, onSiteUpdated }) {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentSite, setPaymentSite] = useState(site);
  const [connectingSquare, setConnectingSquare] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [creatingCheckoutFor, setCreatingCheckoutFor] = useState(null);

  useEffect(() => {
    setPaymentSite(site);
  }, [site]);

  const siteSettings = paymentSite?.settings || {};

  // Square status
  const squareConnected = Boolean(siteSettings.square_merchant_id && siteSettings.square_connected);
  const squareReady = squareConnected && Boolean(siteSettings.square_location_id);

  // Stripe status
  const stripeConnected = Boolean(siteSettings.stripe_account_id);
  const stripeReady = stripeConnected && siteSettings.stripe_charges_enabled !== false;

  // Active provider: whichever is connected (Square preferred)
  const activeProvider = squareReady ? "square" : stripeReady ? "stripe" : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentRows, customerRows, appointmentRows] = await Promise.all([
        fetchPayments(siteId),
        fetchCustomers(siteId),
        fetchAppointments(siteId),
      ]);
      setPayments(paymentRows);
      setCustomers(customerRows);
      setAppointments(appointmentRows);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPayments = useMemo(() => {
    if (statusFilter === "all") return payments;
    return payments.filter((payment) => payment.status === statusFilter);
  }, [payments, statusFilter]);

  const totals = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        const amount = Number(payment.amount || 0);
        if (payment.status === "paid") acc.paid += amount;
        if (payment.status === "pending" || payment.status === "payment_link_sent") acc.outstanding += amount;
        acc.total += amount;
        return acc;
      },
      { total: 0, paid: 0, outstanding: 0 }
    );
  }, [payments]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (payment) => {
    setForm({
      customer_id: payment.customer_id || "",
      appointment_id: payment.appointment_id || "",
      label: payment.label || "",
      amount: payment.amount || "",
      currency: payment.currency || "USD",
      status: payment.status || "pending",
      payment_method: payment.payment_method || "",
      external_reference: payment.external_reference || "",
      checkout_url: payment.checkout_url || "",
      due_at: toDateTimeLocal(payment.due_at),
      paid_at: toDateTimeLocal(payment.paid_at),
      notes: payment.notes || "",
    });
    setEditingId(payment.id);
    setShowForm(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.label || !form.amount) return;

    setSaving(true);
    try {
      const payload = {
        site_id: siteId,
        customer_id: form.customer_id || null,
        appointment_id: form.appointment_id || null,
        label: form.label,
        amount: Number(form.amount),
        currency: form.currency || "USD",
        status: form.status,
        payment_method: form.payment_method || null,
        external_reference: form.external_reference || null,
        checkout_url: form.checkout_url || null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
        notes: form.notes || null,
      };

      if (editingId) {
        const updated = await updatePayment(editingId, payload);
        setPayments((prev) => prev.map((payment) => (payment.id === editingId ? updated : payment)));
      } else {
        const created = await createPayment(payload);
        setPayments((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await deletePayment(id);
      setPayments((prev) => prev.filter((payment) => payment.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickStatus = async (payment, status) => {
    try {
      const updated = await updatePayment(payment.id, {
        status,
        paid_at: status === "paid" ? new Date().toISOString() : payment.paid_at,
      });
      setPayments((prev) => prev.map((row) => (row.id === payment.id ? updated : row)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleConnectSquare = async () => {
    setConnectingSquare(true);
    try {
      const result = await createSquareOAuthLink(siteId);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
    } finally {
      setConnectingSquare(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const result = await createStripeConnectOnboardingLink(siteId, {
        refreshUrl: `${window.location.origin}/admin`,
        returnUrl: `${window.location.origin}/admin`,
      });

      const updatedSite = {
        ...paymentSite,
        settings: {
          ...(paymentSite?.settings || {}),
          stripe_account_id: result.accountId,
          stripe_charges_enabled: result.chargesEnabled,
          stripe_details_submitted: result.detailsSubmitted,
          payment_provider: "stripe_connect",
        },
      };

      setPaymentSite(updatedSite);
      onSiteUpdated?.(updatedSite);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
    } finally {
      setConnectingStripe(false);
    }
  };

  // Check for Square OAuth callback result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const squareResult = params.get("square");
    if (squareResult === "success") {
      load();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [load]);

  const handleGenerateCheckout = async (payment) => {
    setCreatingCheckoutFor(payment.id);
    try {
      const urls = {
        successUrl: `${window.location.origin}/book/${paymentSite?.slug || "site"}?payment=success`,
        cancelUrl: `${window.location.origin}/book/${paymentSite?.slug || "site"}?payment=cancelled`,
      };

      let result;
      if (activeProvider === "stripe") {
        result = await createStripeCheckoutLink(siteId, payment.id, urls);
      } else {
        result = await createSquareCheckoutLink(siteId, payment.id, urls);
      }

      setPayments((prev) => prev.map((row) => (row.id === payment.id ? { ...row, ...result.payment } : row)));
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingCheckoutFor(null);
    }
  };

  const handleCopyCheckout = async (checkoutUrl) => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: 200 }}>
        <div className="loading-spinner" />
        <span>Loading payments...</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <section className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2>{editingId ? "Edit Payment" : "Add Payment"}</h2>
        <form className="admin-form" onSubmit={handleSave}>
          <label className="field">
            <span>Label *</span>
            <input
              type="text"
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ceramic coating deposit"
            />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Amount *</span>
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Currency</span>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                maxLength={3}
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Customer</span>
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Appointment</span>
              <select value={form.appointment_id} onChange={(e) => setForm({ ...form, appointment_id: e.target.value })}>
                <option value="">Select appointment</option>
                {appointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.title} · {formatDateTime(appointment.scheduled_at)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Payment method</span>
              <input
                type="text"
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                placeholder="card, cash, zelle, square"
              />
            </label>
            <label className="field">
              <span>External reference</span>
              <input
                type="text"
                value={form.external_reference}
                onChange={(e) => setForm({ ...form, external_reference: e.target.value })}
                placeholder="Invoice or checkout ID"
              />
            </label>
          </div>

          <label className="field">
            <span>Checkout URL</span>
            <input
              type="url"
              value={form.checkout_url}
              onChange={(e) => setForm({ ...form, checkout_url: e.target.value })}
              placeholder="https://..."
            />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Due at</span>
              <input
                type="datetime-local"
                value={form.due_at}
                onChange={(e) => setForm({ ...form, due_at: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Paid at</span>
              <input
                type="datetime-local"
                value={form.paid_at}
                onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal payment notes"
            />
          </label>

          <div className="row-gap">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Payment" : "Create Payment"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <div className="admin-payments">
      <div className="admin-section-header">
        <div>
          <h2>Payments</h2>
          <p className="muted">Track deposits, balances, and payment links for this site.</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
            ↻ Refresh
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + Add Payment
          </button>
        </div>
      </div>

      <section className="panel payment-processor-panel">
        <div className="payment-processor-header">
          <div>
            <h3>Payment Processing</h3>
            <p className="muted">Connect a payment account so your client can accept payments directly. Just click a button — no manual setup needed.</p>
          </div>
        </div>

        <div className="payment-provider-options">
          <div className={`payment-provider-card panel ${squareConnected ? "provider-connected" : ""}`}>
            <div className="payment-provider-card-header">
              <div>
                <h4>Square {squareReady && <span className="status-badge payment-status-paid">Active</span>}</h4>
                <p className="muted">Recommended — fast setup, great for service businesses.</p>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleConnectSquare} disabled={connectingSquare}>
                {connectingSquare ? "Opening..." : squareConnected ? "Reconnect" : "Connect Square"}
              </button>
            </div>
            {squareConnected && (
              <div className="payment-processor-grid">
                <div className="payment-processor-card">
                  <span className="detail-label">Merchant</span>
                  <strong>{siteSettings.square_merchant_id}</strong>
                </div>
                <div className="payment-processor-card">
                  <span className="detail-label">Location</span>
                  <strong>{siteSettings.square_location_id || "Pending"}</strong>
                </div>
                <div className="payment-processor-card">
                  <span className="detail-label">Ready</span>
                  <strong>{squareReady ? "Yes" : "No"}</strong>
                </div>
              </div>
            )}
          </div>

          <div className={`payment-provider-card panel ${stripeConnected ? "provider-connected" : ""}`}>
            <div className="payment-provider-card-header">
              <div>
                <h4>Stripe {stripeReady && <span className="status-badge payment-status-paid">Active</span>}</h4>
                <p className="muted">Alternative option — connect if you already use Stripe.</p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleConnectStripe} disabled={connectingStripe}>
                {connectingStripe ? "Opening..." : stripeConnected ? "Review Setup" : "Connect Stripe"}
              </button>
            </div>
            {stripeConnected && (
              <div className="payment-processor-grid">
                <div className="payment-processor-card">
                  <span className="detail-label">Account</span>
                  <strong>{siteSettings.stripe_account_id}</strong>
                </div>
                <div className="payment-processor-card">
                  <span className="detail-label">Charges</span>
                  <strong>{stripeReady ? "Enabled" : "Pending"}</strong>
                </div>
                <div className="payment-processor-card">
                  <span className="detail-label">Details</span>
                  <strong>{siteSettings.stripe_details_submitted ? "Submitted" : "Pending"}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeProvider && (
          <p className="muted payment-processor-note">
            Currently using <strong>{activeProvider === "square" ? "Square" : "Stripe"}</strong> for checkout links. {squareReady && stripeReady ? "Square is preferred when both are connected." : ""}
          </p>
        )}
        {!activeProvider && (
          <p className="muted payment-processor-note">
            Connect Square or Stripe above to start generating checkout links. Your client signs into their own account — money goes directly to them.
          </p>
        )}
      </section>

      <div className="analytics-summary payment-summary-grid">
        <div className="analytics-stat">
          <div className="analytics-stat-value">{formatMoney(totals.total)}</div>
          <div className="analytics-stat-label">Tracked Revenue</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">{formatMoney(totals.paid)}</div>
          <div className="analytics-stat-label">Collected</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">{formatMoney(totals.outstanding)}</div>
          <div className="analytics-stat-label">Outstanding</div>
        </div>
      </div>

      <div className="inquiry-filters">
        <button
          type="button"
          className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All ({payments.length})
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            className={`filter-chip ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status.replace(/_/g, " ")} ({payments.filter((payment) => payment.status === status).length})
          </button>
        ))}
      </div>

      {filteredPayments.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">$</span>
          <h3>No payment records yet</h3>
          <p className="muted">Add deposit or invoice records to track what has been collected and what is still due.</p>
        </div>
      ) : (
        <div className="payments-list">
          {filteredPayments.map((payment) => (
            <article key={payment.id} className="payment-card panel">
              <div className="payment-card-header">
                <div>
                  <h3>{payment.label}</h3>
                  <p className="muted">
                    {payment.customers
                      ? `${payment.customers.first_name} ${payment.customers.last_name}`
                      : "No customer linked"}
                  </p>
                </div>
                <div className={`status-badge payment-status-${payment.status}`}>
                  {payment.status.replace(/_/g, " ")}
                </div>
              </div>

              <div className="payment-card-grid">
                <div>
                  <span className="detail-label">Amount</span>
                  <div className="payment-amount">{formatMoney(payment.amount, payment.currency)}</div>
                </div>
                <div>
                  <span className="detail-label">Due</span>
                  <div>{payment.due_at ? formatDateTime(payment.due_at) : "Not set"}</div>
                </div>
                <div>
                  <span className="detail-label">Paid</span>
                  <div>{payment.paid_at ? formatDateTime(payment.paid_at) : "Not paid"}</div>
                </div>
                <div>
                  <span className="detail-label">Appointment</span>
                  <div>{payment.appointments?.title || "Not linked"}</div>
                </div>
              </div>

              {(payment.checkout_url || payment.external_reference || payment.notes) && (
                <div className="payment-card-meta">
                  {payment.checkout_url && (
                    <a href={payment.checkout_url} target="_blank" rel="noreferrer" className="detail-value">
                      Open checkout link
                    </a>
                  )}
                  {payment.external_reference && <span className="muted">Ref: {payment.external_reference}</span>}
                  {payment.notes && <p className="muted">{payment.notes}</p>}
                </div>
              )}

              <div className="payment-card-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEdit(payment)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleGenerateCheckout(payment)}
                  disabled={!activeProvider || creatingCheckoutFor === payment.id}
                >
                  {creatingCheckoutFor === payment.id ? "Generating..." : payment.checkout_url ? "Regenerate Checkout" : "Generate Checkout"}
                </button>
                {payment.status !== "paid" && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handleQuickStatus(payment, "paid")}>
                    Mark Paid
                  </button>
                )}
                {payment.status !== "payment_link_sent" && payment.checkout_url && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickStatus(payment, "payment_link_sent")}>
                    Link Sent
                  </button>
                )}
                {payment.checkout_url && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleCopyCheckout(payment.checkout_url)}>
                    Copy Link
                  </button>
                )}
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(payment.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}