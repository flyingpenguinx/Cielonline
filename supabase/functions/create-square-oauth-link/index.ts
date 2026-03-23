import { corsHeaders, loadOwnedSite } from "../_shared/site-access.ts";

const squareAppId = Deno.env.get("SQUARE_APPLICATION_ID") ?? "";
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
    if (!squareAppId) {
      throw new Error("Missing SQUARE_APPLICATION_ID.");
    }

    const { siteId } = await req.json();
    await loadOwnedSite(req, siteId);

    const state = btoa(JSON.stringify({ siteId }));
    const scopes = [
      "PAYMENTS_WRITE",
      "PAYMENTS_READ",
      "ORDERS_WRITE",
      "ORDERS_READ",
      "MERCHANT_PROFILE_READ",
      "ITEMS_READ",
      "ITEMS_WRITE",
      "ONLINE_STORE_SITE_READ",
    ].join("+");

    const baseUrl = getSquareBaseUrl();
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/square-oauth-callback`;

    const authorizeUrl =
      `${baseUrl}/oauth2/authorize` +
      `?client_id=${squareAppId}` +
      `&scope=${scopes}` +
      `&session=false` +
      `&state=${encodeURIComponent(state)}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}`;

    return new Response(JSON.stringify({ url: authorizeUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
