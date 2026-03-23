import { isSupabaseConfigured, supabase } from "./supabaseClient";

function guard() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase not configured. Add .env values first.");
  }
}

export const DEFAULT_SITE_CONTENT_FIELDS = [
  {
    key: "business.booking_url",
    label: "Primary booking URL",
    type: "url",
    section: "Business",
    page: "Business",
    group: "Core links",
    layerName: "Booking link",
    helpText: "Used by booking buttons across the live website canvas.",
    placeholder: "https://cielonline.com/book/your-site-slug",
  },
  {
    key: "business.payment_url",
    label: "Primary payment URL",
    type: "url",
    section: "Business",
    page: "Business",
    group: "Core links",
    layerName: "Payment link",
    helpText: "Optional checkout or invoice URL used for payment buttons.",
    placeholder: "https://pay.example.com/your-checkout-link",
  },
  {
    key: "business.phone",
    label: "Business phone",
    type: "text",
    section: "Business",
    page: "Business",
    group: "Contact details",
    layerName: "Phone number",
    helpText: "Public-facing phone number for buttons, cards, and footer areas.",
    placeholder: "(916) 555-1234",
  },
  {
    key: "business.email",
    label: "Business email",
    type: "text",
    section: "Business",
    page: "Business",
    group: "Contact details",
    layerName: "Email address",
    helpText: "Public-facing email address for inquiries and footer links.",
    placeholder: "hello@example.com",
  },
  {
    key: "home.hero.label",
    label: "Hero label",
    type: "text",
    section: "Homepage",
    page: "Home",
    group: "Hero",
    layerName: "Hero eyebrow",
    helpText: "Small text above the main hero heading.",
    placeholder: "Premium Detailing Service",
  },
  {
    key: "home.hero.title_line_1",
    label: "Hero title line 1",
    type: "text",
    section: "Homepage",
    page: "Home",
    group: "Hero",
    layerName: "Hero title line 1",
    helpText: "First line of the main homepage headline.",
    placeholder: "Your ride.",
  },
  {
    key: "home.hero.title_line_2",
    label: "Hero emphasized word",
    type: "text",
    section: "Homepage",
    page: "Home",
    group: "Hero",
    layerName: "Hero emphasis",
    helpText: "Highlighted word in the hero headline.",
    placeholder: "shine.",
  },
  {
    key: "home.hero.description",
    label: "Hero description",
    type: "textarea",
    section: "Homepage",
    page: "Home",
    group: "Hero",
    layerName: "Hero description",
    helpText: "Main supporting paragraph in the hero section.",
    placeholder: "Describe the business in the hero section.",
  },
  {
    key: "home.contact.heading",
    label: "Contact heading",
    type: "text",
    section: "Homepage",
    page: "Home",
    group: "Quote form",
    layerName: "Quote heading",
    helpText: "Heading above the homepage quote form.",
    placeholder: "Request a Quote",
  },
  {
    key: "home.contact.subtitle",
    label: "Contact subtitle",
    type: "textarea",
    section: "Homepage",
    page: "Home",
    group: "Quote form",
    layerName: "Quote subtitle",
    helpText: "Short explanation shown above the homepage quote form.",
    placeholder: "Explain what happens after the form is submitted.",
  },
  {
    key: "home.quote.success_message",
    label: "Quote success message",
    type: "textarea",
    section: "Homepage",
    page: "Home",
    group: "Quote form",
    layerName: "Quote success state",
    helpText: "Message shown after the visitor submits the homepage quote form.",
    placeholder: "Thanks. We received your request and will contact you shortly.",
  },
  {
    key: "services.quote.heading",
    label: "Services-page emphasized word",
    type: "text",
    section: "Services page",
    page: "Services",
    group: "Quote form",
    layerName: "Services quote emphasis",
    helpText: "Highlighted word inside the services page quote heading.",
    placeholder: "Quote",
  },
  {
    key: "services.quote.subtitle",
    label: "Services-page quote subtitle",
    type: "textarea",
    section: "Services page",
    page: "Services",
    group: "Quote form",
    layerName: "Services quote subtitle",
    helpText: "Supporting copy shown above the services page quote form.",
    placeholder: "Tell visitors how to request a quote from the services page.",
  },
];

export function getDefaultSiteContentEntries(siteId) {
  return DEFAULT_SITE_CONTENT_FIELDS.map((field, index) => ({
    site_id: siteId,
    content_key: field.key,
    label: field.label,
    field_type: field.type,
    section_name: field.section,
    page_path: field.key.startsWith("services.") ? "/services" : "/",
    sort_order: index,
    value_text: "",
    is_public: true,
  }));
}

export async function fetchSiteContentEntries(siteId) {
  guard();
  const { data, error } = await supabase
    .from("site_content_entries")
    .select("*")
    .eq("site_id", siteId)
    .order("section_name", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertSiteContentEntries(siteId, entries) {
  guard();
  const payload = entries.map((entry, index) => ({
    site_id: siteId,
    content_key: entry.content_key,
    label: entry.label,
    field_type: entry.field_type || "text",
    section_name: entry.section_name || "General",
    page_path: entry.page_path || "/",
    sort_order: entry.sort_order ?? index,
    value_text: entry.value_text ?? "",
    value_json: entry.value_json ?? null,
    is_public: entry.is_public !== false,
  }));

  const { data, error } = await supabase
    .from("site_content_entries")
    .upsert(payload, { onConflict: "site_id,content_key" })
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function fetchSiteEvents(siteId, limit = 500) {
  guard();
  const { data, error } = await supabase
    .from("site_events")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function trackSiteEvent(event) {
  guard();
  const { data, error } = await supabase
    .from("site_events")
    .insert({
      site_id: event.site_id,
      page_path: event.page_path || window.location.pathname,
      event_type: event.event_type || "engagement",
      event_name: event.event_name,
      visitor_id: event.visitor_id || null,
      metadata: event.metadata || {},
      referrer: event.referrer || (typeof document !== "undefined" ? document.referrer : null),
      user_agent: event.user_agent || (typeof navigator !== "undefined" ? navigator.userAgent : null),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPayments(siteId) {
  guard();
  const { data, error } = await supabase
    .from("payments")
    .select("*, customers(id, first_name, last_name, email), appointments(id, title, scheduled_at)")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPayment(payment) {
  guard();
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select("*, customers(id, first_name, last_name, email), appointments(id, title, scheduled_at)")
    .single();

  if (error) throw error;
  return data;
}

export async function updatePayment(id, updates) {
  guard();
  const { data, error } = await supabase
    .from("payments")
    .update(updates)
    .eq("id", id)
    .select("*, customers(id, first_name, last_name, email), appointments(id, title, scheduled_at)")
    .single();

  if (error) throw error;
  return data;
}

export async function deletePayment(id) {
  guard();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
}

export async function createSquareOAuthLink(siteId) {
  guard();
  const { data, error } = await supabase.functions.invoke("create-square-oauth-link", {
    body: { siteId },
  });

  if (error) throw error;
  return data;
}

export async function createSquareCheckoutLink(siteId, paymentId, { successUrl, cancelUrl }) {
  guard();
  const { data, error } = await supabase.functions.invoke("create-square-checkout-link", {
    body: { siteId, paymentId, successUrl, cancelUrl },
  });

  if (error) throw error;
  return data;
}

export async function createStripeConnectOnboardingLink(siteId, { refreshUrl, returnUrl }) {
  guard();
  const { data, error } = await supabase.functions.invoke("create-stripe-account-link", {
    body: { siteId, refreshUrl, returnUrl },
  });

  if (error) throw error;
  return data;
}

export async function createStripeCheckoutLink(siteId, paymentId, { successUrl, cancelUrl }) {
  guard();
  const { data, error } = await supabase.functions.invoke("create-stripe-checkout-link", {
    body: { siteId, paymentId, successUrl, cancelUrl },
  });

  if (error) throw error;
  return data;
}

export async function createPublicBookingCheckoutLink(siteId, paymentId, provider, { successUrl, cancelUrl }) {
  guard();
  const functionName = provider === "stripe"
    ? "create-stripe-checkout-link"
    : "create-square-checkout-link";

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { siteId, paymentId, successUrl, cancelUrl },
  });

  if (error) throw error;
  return data;
}

export async function fetchPublicSiteBySlug(slug) {
  guard();
  const { data, error } = await supabase
    .from("client_sites")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPublicSiteContent(siteId) {
  guard();
  const { data, error } = await supabase
    .from("site_content_entries")
    .select("content_key, field_type, value_text, value_json")
    .eq("site_id", siteId)
    .eq("is_public", true);

  if (error) throw error;

  return (data ?? []).reduce((acc, entry) => {
    acc[entry.content_key] = entry.field_type === "json" ? entry.value_json : entry.value_text;
    return acc;
  }, {});
}

export async function createBookingRequest({
  siteId,
  customer,
  appointment,
  depositAmount = 0,
  checkoutUrl = null,
}) {
  guard();

  const { data: createdCustomer, error: customerError } = await supabase
    .from("customers")
    .insert({
      site_id: siteId,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email || null,
      phone: customer.phone || null,
      vehicle_make: customer.vehicle_make || null,
      vehicle_model: customer.vehicle_model || null,
      vehicle_year: customer.vehicle_year || null,
      vehicle_color: customer.vehicle_color || null,
      address: customer.address || null,
      tags: customer.tags || [],
      source: "booking_portal",
    })
    .select()
    .single();

  if (customerError) throw customerError;

  const { data: createdAppointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      site_id: siteId,
      customer_id: createdCustomer.id,
      title: appointment.title,
      service_name: appointment.service_name || null,
      scheduled_at: appointment.scheduled_at,
      duration_minutes: appointment.duration_minutes || 60,
      notes: appointment.notes || null,
      status: appointment.status || "requested",
    })
    .select("*, customers(id, first_name, last_name, email, phone)")
    .single();

  if (appointmentError) throw appointmentError;

  let createdPayment = null;
  if (depositAmount > 0) {
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        site_id: siteId,
        customer_id: createdCustomer.id,
        appointment_id: createdAppointment.id,
        label: `${appointment.service_name || appointment.title} deposit`,
        amount: depositAmount,
        currency: "USD",
        status: checkoutUrl ? "payment_link_sent" : "pending",
        checkout_url: checkoutUrl,
        due_at: appointment.scheduled_at,
        notes: "Created automatically from the public booking portal.",
      })
      .select()
      .single();

    if (paymentError) throw paymentError;
    createdPayment = payment;
  }

  return {
    customer: createdCustomer,
    appointment: createdAppointment,
    payment: createdPayment,
  };
}