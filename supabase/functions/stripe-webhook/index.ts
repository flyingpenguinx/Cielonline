import Stripe from "npm:stripe@14.25.0";
import { createServiceClient } from "../_shared/site-access.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

Deno.serve(async (req) => {
  try {
    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error("Missing Stripe webhook env vars.");
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    const serviceClient = createServiceClient();

    const markPayment = async (paymentId: string, updates: Record<string, unknown>) => {
      await serviceClient.from("payments").update(updates).eq("id", paymentId);
    };

    const syncConnectedAccount = async (account: Stripe.Account) => {
      const siteId = account.metadata?.site_id;

      let siteQuery = serviceClient.from("client_sites").select("*");
      if (siteId) {
        siteQuery = siteQuery.eq("id", siteId);
      } else {
        siteQuery = siteQuery.eq("settings->>stripe_account_id", account.id);
      }

      const { data: site, error } = await siteQuery.single();
      if (error || !site) {
        return;
      }

      const nextSettings = {
        ...(site.settings || {}),
        payment_provider: "stripe_connect",
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_payouts_enabled: account.payouts_enabled,
      };

      await serviceClient
        .from("client_sites")
        .update({ settings: nextSettings })
        .eq("id", site.id);
    };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.payment_id;
      if (paymentId) {
        await markPayment(paymentId, {
          status: "paid",
          paid_at: new Date().toISOString(),
          external_reference: session.id,
          payment_method: "stripe_checkout",
        });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = paymentIntent.metadata?.payment_id;
      if (paymentId) {
        await markPayment(paymentId, {
          status: "failed",
          external_reference: paymentIntent.id,
          payment_method: "stripe_checkout",
        });
      }
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      await syncConnectedAccount(account);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});