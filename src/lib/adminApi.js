import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ─── Guard ───
function guard() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase not configured. Add .env values first.");
  }
}

// ══════════════════════════════════════════════════════════════════
// SITES
// ══════════════════════════════════════════════════════════════════
export async function fetchUserSites(userId) {
  guard();
  const { data, error } = await supabase
    .from("client_sites")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ══════════════════════════════════════════════════════════════════
// CUSTOMERS (CRM)
// ══════════════════════════════════════════════════════════════════
export async function fetchCustomers(siteId) {
  guard();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCustomer(customer) {
  guard();
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id, updates) {
  guard();
  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id) {
  guard();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════════
// INQUIRIES / LEADS
// ══════════════════════════════════════════════════════════════════
export async function fetchInquiries(siteId) {
  guard();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateInquiryStatus(id, status, notes) {
  guard();
  const updates = { status };
  if (notes !== undefined) updates.admin_notes = notes;
  const { data, error } = await supabase
    .from("inquiries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInquiry(id) {
  guard();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ══════════════════════════════════════════════════════════════════
export async function fetchAppointments(siteId) {
  guard();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, customers(id, first_name, last_name, email, phone)")
    .eq("site_id", siteId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAppointment(appointment) {
  guard();
  const { data, error } = await supabase
    .from("appointments")
    .insert(appointment)
    .select("*, customers(id, first_name, last_name, email, phone)")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(id, updates) {
  guard();
  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .select("*, customers(id, first_name, last_name, email, phone)")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAppointment(id) {
  guard();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════════
// SERVICES
// ══════════════════════════════════════════════════════════════════
export async function fetchServices(siteId) {
  guard();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createService(service) {
  guard();
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(id, updates) {
  guard();
  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(id) {
  guard();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════════
// CUSTOMER NOTES
// ══════════════════════════════════════════════════════════════════
export async function fetchCustomerNotes(customerId) {
  guard();
  const { data, error } = await supabase
    .from("customer_notes")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCustomerNote(note) {
  guard();
  const { data, error } = await supabase
    .from("customer_notes")
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomerNote(id) {
  guard();
  const { error } = await supabase.from("customer_notes").delete().eq("id", id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD STATS (Aggregates)
// ══════════════════════════════════════════════════════════════════
export async function fetchDashboardStats(siteId) {
  guard();
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [customersRes, inquiriesRes, newInquiriesRes, appointmentsRes, upcomingRes] =
    await Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("site_id", siteId),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("site_id", siteId),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "new"),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("scheduled_at", thirtyDaysAgo),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("scheduled_at", now).in("status", ["scheduled", "confirmed"]),
    ]);

  return {
    totalCustomers: customersRes.count ?? 0,
    totalInquiries: inquiriesRes.count ?? 0,
    newInquiries: newInquiriesRes.count ?? 0,
    appointmentsThisMonth: appointmentsRes.count ?? 0,
    upcomingAppointments: upcomingRes.count ?? 0,
  };
}

// ══════════════════════════════════════════════════════════════════
// RECENT ACTIVITY FEED
// ══════════════════════════════════════════════════════════════════
export async function fetchRecentActivity(siteId, limit = 15) {
  guard();
  const [inquiries, appointments] = await Promise.all([
    supabase
      .from("inquiries")
      .select("id, name, email, service_requested, status, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("appointments")
      .select("id, title, status, scheduled_at, created_at, customers(first_name, last_name)")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items = [];
  (inquiries.data ?? []).forEach((i) =>
    items.push({ type: "inquiry", ...i, sort_date: i.created_at })
  );
  (appointments.data ?? []).forEach((a) =>
    items.push({ type: "appointment", ...a, sort_date: a.created_at })
  );

  items.sort((a, b) => new Date(b.sort_date) - new Date(a.sort_date));
  return items.slice(0, limit);
}
