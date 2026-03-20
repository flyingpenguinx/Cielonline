import Stripe from "npm:stripe@14.25.0";
import { corsHeaders, loadOwnedSite, updateSiteSettings } from "../_shared/site-access.ts";

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

    const { siteId, refreshUrl, returnUrl } = await req.json();
    const { serviceClient, site } = await loadOwnedSite(req, siteId);

    let accountId = site.settings?.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        metadata: {
          site_id: site.id,
          site_name: site.site_name,
        },
        business_profile: {
          name: site.site_name,
          url: site.site_url || undefined,
        },
      });
      accountId = account.id;
    }

    const account = await stripe.accounts.retrieve(accountId);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    await updateSiteSettings(serviceClient, site, {
      payment_provider: "stripe_connect",
      stripe_account_id: accountId,
      stripe_charges_enabled: account.charges_enabled,
      stripe_details_submitted: account.details_submitted,
    });

    return new Response(JSON.stringify({
      url: accountLink.url,
      accountId,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});