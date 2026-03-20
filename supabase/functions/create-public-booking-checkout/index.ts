import Stripe from "npm:stripe@14.25.0";
import { corsHeaders, loadPublishedSite } from "../_shared/site-access.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!stripeSecretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY.");
    }

    const { siteId, paymentId, successUrl, cancelUrl } = await req.json();
    const { serviceClient, site } = await loadPublishedSite(siteId);
    const stripeAccountId = site.settings?.stripe_account_id;

    if (!stripeAccountId) {
      throw new Error("Stripe is not connected for this site.");
    }

    const { data: payment, error } = await serviceClient
      .from("payments")
      .select("*, customers(email, first_name, last_name)")
      .eq("id", paymentId)
      .eq("site_id", siteId)
      .single();

    if (error || !payment) {
      throw new Error("Payment record not found.");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: payment.customers?.email || undefined,
      client_reference_id: payment.id,
      metadata: {
        payment_id: payment.id,
        site_id: siteId,
      },
      payment_intent_data: {
        metadata: {
          payment_id: payment.id,
          site_id: siteId,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (payment.currency || "USD").toLowerCase(),
            unit_amount: Math.round(Number(payment.amount || 0) * 100),
            product_data: {
              name: payment.label,
              description: payment.notes || undefined,
            },
          },
        },
      ],
    }, {
      stripeAccount: stripeAccountId,
    });

    await serviceClient
      .from("payments")
      .update({
        checkout_url: session.url,
        external_reference: session.id,
        status: "payment_link_sent",
        payment_method: "stripe_checkout",
      })
      .eq("id", payment.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});