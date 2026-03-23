import { createServiceClient } from "../_shared/site-access.ts";

const squareAppId = Deno.env.get("SQUARE_APPLICATION_ID") ?? "";
const squareAppSecret = Deno.env.get("SQUARE_APPLICATION_SECRET") ?? "";
const squareEnvironment = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";
const frontendOrigin = Deno.env.get("FRONTEND_ORIGIN") ?? "https://cielonline.com";

function getSquareBaseUrl(): string {
  return squareEnvironment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");

    if (!code || !stateParam) {
      return Response.redirect(`${frontendOrigin}/admin?square=error&reason=missing_params`, 302);
    }

    let siteId: string;
    try {
      const parsed = JSON.parse(atob(stateParam));
      siteId = parsed.siteId;
    } catch {
      return Response.redirect(`${frontendOrigin}/admin?square=error&reason=invalid_state`, 302);
    }

    const baseUrl = getSquareBaseUrl();

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: squareAppId,
        client_secret: squareAppSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Square token exchange failed:", tokenData);
      return Response.redirect(`${frontendOrigin}/admin?square=error&reason=token_exchange`, 302);
    }

    const { access_token, refresh_token, merchant_id, expires_at } = tokenData;

    // Fetch merchant's primary location
    const locationsResponse = await fetch(`${baseUrl}/v2/locations`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const locationsData = await locationsResponse.json();
    const primaryLocation = locationsData.locations?.find(
      (loc: { status: string }) => loc.status === "ACTIVE"
    ) || locationsData.locations?.[0];

    const serviceClient = createServiceClient();

    // Load current site settings
    const { data: site, error: siteError } = await serviceClient
      .from("client_sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return Response.redirect(`${frontendOrigin}/admin?square=error&reason=site_not_found`, 302);
    }

    // Update site settings with Square credentials
    const nextSettings = {
      ...(site.settings || {}),
      payment_provider: "square",
      square_merchant_id: merchant_id,
      square_access_token: access_token,
      square_refresh_token: refresh_token,
      square_token_expires_at: expires_at,
      square_location_id: primaryLocation?.id || null,
      square_connected: true,
    };

    await serviceClient
      .from("client_sites")
      .update({ settings: nextSettings })
      .eq("id", siteId);

    return Response.redirect(`${frontendOrigin}/admin?square=success`, 302);
  } catch (error) {
    console.error("Square OAuth callback error:", error);
    return Response.redirect(`${frontendOrigin}/admin?square=error&reason=internal`, 302);
  }
});
