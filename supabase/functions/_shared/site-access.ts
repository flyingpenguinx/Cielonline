import { createClient } from "npm:@supabase/supabase-js@2.53.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function requireUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace("Bearer ", "").trim();

  if (!token) {
    throw new Error("Missing authorization token.");
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Unable to verify user session.");
  }

  return data.user;
}

export async function loadOwnedSite(req: Request, siteId: string) {
  const user = await requireUser(req);
  const serviceClient = createServiceClient();

  const { data: site, error } = await serviceClient
    .from("client_sites")
    .select("*")
    .eq("id", siteId)
    .eq("owner_id", user.id)
    .single();

  if (error || !site) {
    throw new Error("Site not found or access denied.");
  }

  return { user, serviceClient, site };
}

export async function loadPublishedSite(siteId: string) {
  const serviceClient = createServiceClient();

  const { data: site, error } = await serviceClient
    .from("client_sites")
    .select("*")
    .eq("id", siteId)
    .eq("is_published", true)
    .single();

  if (error || !site) {
    throw new Error("Published site not found.");
  }

  return { serviceClient, site };
}

export async function updateSiteSettings(serviceClient: ReturnType<typeof createServiceClient>, site: any, patch: Record<string, unknown>) {
  const nextSettings = {
    ...(site.settings || {}),
    ...patch,
  };

  const { data, error } = await serviceClient
    .from("client_sites")
    .update({ settings: nextSettings })
    .eq("id", site.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}