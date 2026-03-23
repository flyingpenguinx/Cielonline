import { corsHeaders, loadOwnedSite } from "../_shared/site-access.ts";

const squareEnvironment = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";

function getSquareBaseUrl(): string {
  return squareEnvironment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { siteId, paymentId, successUrl, cancelUrl } = await req.json();
    const { serviceClient, site } = await loadOwnedSite(req, siteId);

    const accessToken = site.settings?.square_access_token;
    const locationId = site.settings?.square_location_id;

    if (!accessToken || !locationId) {
      throw new Error("Square is not connected for this site.");
    }

    // Load the payment record
    const { data: payment, error } = await serviceClient
      .from("payments")
      .select("*, customers(email, first_name, last_name)")
      .eq("id", paymentId)
      .eq("site_id", siteId)
      .single();

    if (error || !payment) {
      throw new Error("Payment record not found.");
    }

    const amountCents = Math.round(Number(payment.amount || 0) * 100);
    const baseUrl = getSquareBaseUrl();

    // Create Square payment link
    const response = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `${paymentId}-${Date.now()}`,
        quick_pay: {
          name: payment.label,
          price_money: {
            amount: amountCents,
            currency: (payment.currency || "USD").toUpperCase(),
          },
          location_id: locationId,
        },
        checkout_options: {
          redirect_url: successUrl,
          allow_tipping: false,
        },
        payment_note: payment.notes || undefined,
        pre_populated_data: payment.customers?.email
          ? { buyer_email: payment.customers.email }
          : undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.payment_link) {
      console.error("Square checkout creation failed:", result);
      throw new Error(result.errors?.[0]?.detail || "Failed to create Square checkout link.");
    }

    const checkoutUrl = result.payment_link.url;
    const orderId = result.payment_link.order_id;

    // Update payment record with checkout link
    const { data: updatedPayment, error: updateError } = await serviceClient
      .from("payments")
      .update({
        checkout_url: checkoutUrl,
        external_reference: orderId,
        status: "payment_link_sent",
        payment_method: "square_checkout",
      })
      .eq("id", payment.id)
      .select("*, customers(id, first_name, last_name, email), appointments(id, title, scheduled_at)")
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ url: checkoutUrl, payment: updatedPayment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
