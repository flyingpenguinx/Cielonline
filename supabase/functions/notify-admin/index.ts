// ──────────────────────────────────────────────────────────────────
// Supabase Edge Function: notify-admin
// Deploy this as a Supabase Edge Function to send email
// notifications when new inquiries or appointments are created.
//
// See SETUP_INSTRUCTIONS.md for deployment steps.
// ──────────────────────────────────────────────────────────────────

// This function is triggered by a Supabase Database Webhook.
// It sends an email via Resend (https://resend.com) when:
//   1. A new row is inserted into the `inquiries` table
//   2. A new row is inserted into the `appointments` table

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, table, record } = payload;

    if (type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Ignored non-INSERT event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      console.error("Missing RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL env vars");
      return new Response(
        JSON.stringify({ error: "Email not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let htmlBody = "";

    if (table === "inquiries") {
      subject = `🔔 New Inquiry from ${record.name || "a visitor"}`;
      htmlBody = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">New Inquiry Received</h1>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">From your website contact form</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Name</td><td style="padding: 8px 0; font-size: 15px;">${record.name || "N/A"}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Email</td><td style="padding: 8px 0; font-size: 15px;"><a href="mailto:${record.email}" style="color: #2563eb;">${record.email || "N/A"}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Phone</td><td style="padding: 8px 0; font-size: 15px;"><a href="tel:${record.phone}" style="color: #2563eb;">${record.phone || "N/A"}</a></td></tr>
              ${record.service_requested ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Service</td><td style="padding: 8px 0; font-size: 15px;">${record.service_requested}</td></tr>` : ""}
              ${record.vehicle_info ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Vehicle</td><td style="padding: 8px 0; font-size: 15px;">${record.vehicle_info}</td></tr>` : ""}
              ${record.preferred_date ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Preferred Date</td><td style="padding: 8px 0; font-size: 15px;">${new Date(record.preferred_date).toLocaleDateString()}</td></tr>` : ""}
            </table>
            ${record.message ? `<div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Message</p><p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #334155;">${record.message}</p></div>` : ""}
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://cielonline.com/admin" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Admin Portal</a>
            </div>
          </div>
        </div>
      `;
    } else if (table === "appointments") {
      const scheduledDate = record.scheduled_at
        ? new Date(record.scheduled_at).toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "Not specified";

      subject = `📅 New Appointment: ${record.title || "Booking"}`;
      htmlBody = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">New Appointment Booked</h1>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${scheduledDate}</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Title</td><td style="padding: 8px 0; font-size: 15px; font-weight: 600;">${record.title || "N/A"}</td></tr>
              ${record.service_name ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Service</td><td style="padding: 8px 0; font-size: 15px;">${record.service_name}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Duration</td><td style="padding: 8px 0; font-size: 15px;">${record.duration_minutes || 60} minutes</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Status</td><td style="padding: 8px 0; font-size: 15px; text-transform: capitalize;">${(record.status || "scheduled").replace(/_/g, " ")}</td></tr>
            </table>
            ${record.notes ? `<div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 600;">Notes</p><p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #334155;">${record.notes}</p></div>` : ""}
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://cielonline.com/admin" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #059669, #10b981); color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Calendar</a>
            </div>
          </div>
        </div>
      `;
    } else {
      return new Response(JSON.stringify({ message: "Unhandled table" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cielonline <notifications@cielonline.com>",
        to: [ADMIN_EMAIL],
        subject,
        html: htmlBody,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(JSON.stringify({ error: "Failed to send email", details: emailData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
