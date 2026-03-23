import { createClient } from "npm:@supabase/supabase-js@2.53.0";
import { createHmac } from "node:crypto";

const squareWebhookSignatureKey = Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY") ?? "";
const squareEnvironment = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function verifySignature(body: string, signature: string, webhookUrl: string): boolean {
  if (!squareWebhookSignatureKey) return false;

  const combined = webhookUrl + body;
  const expectedSignature = createHmac("sha256", squareWebhookSignatureKey)
    .update(combined)
    .digest("base64");

  return signature === expectedSignature;
}

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature") || "";
    const webhookUrl = `${supabaseUrl}/functions/v1/square-webhook`;

    if (squareWebhookSignatureKey && !verifySignature(body, signature, webhookUrl)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const serviceClient = createServiceClient();

    if (event.type === "payment.completed") {
      const payment = event.data?.object?.payment;
      const orderId = payment?.order_id;

      if (orderId) {
        // Find payment by external_reference (the Square order ID)
        const { data: paymentRecord } = await serviceClient
          .from("payments")
          .select("id")
          .eq("external_reference", orderId)
          .single();

        if (paymentRecord) {
          await serviceClient
            .from("payments")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "square_checkout",
            })
            .eq("id", paymentRecord.id);
        }
      }
    }

    if (event.type === "payment.updated") {
      const payment = event.data?.object?.payment;
      const orderId = payment?.order_id;
      const squareStatus = payment?.status;

      if (orderId && squareStatus === "FAILED") {
        const { data: paymentRecord } = await serviceClient
          .from("payments")
          .select("id")
          .eq("external_reference", orderId)
          .single();

        if (paymentRecord) {
          await serviceClient
            .from("payments")
            .update({
              status: "failed",
              payment_method: "square_checkout",
            })
            .eq("id", paymentRecord.id);
        }
      }
    }

    if (event.type === "refund.created" || event.type === "refund.updated") {
      const refund = event.data?.object?.refund;
      const orderId = refund?.order_id;

      if (orderId && refund?.status === "COMPLETED") {
        const { data: paymentRecord } = await serviceClient
          .from("payments")
          .select("id")
          .eq("external_reference", orderId)
          .single();

        if (paymentRecord) {
          await serviceClient
            .from("payments")
            .update({ status: "refunded" })
            .eq("id", paymentRecord.id);
        }
      }
    }

    // Sync merchant account status updates
    if (event.type === "oauth.authorization.revoked") {
      const merchantId = event.merchant_id;
      if (merchantId) {
        const { data: site } = await serviceClient
          .from("client_sites")
          .select("id, settings")
          .eq("settings->>square_merchant_id", merchantId)
          .single();

        if (site) {
          const nextSettings = {
            ...(site.settings || {}),
            square_connected: false,
            square_access_token: null,
            square_refresh_token: null,
          };

          await serviceClient
            .from("client_sites")
            .update({ settings: nextSettings })
            .eq("id", site.id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Square webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
