import { getUserSession } from "../lib/session.js";
import { getSupabase } from "../lib/supabase.js";
import { CATEGORY_ROLES } from "../lib/roles.js";

const VALID_CATEGORIES = Object.keys(CATEGORY_ROLES);

async function getOwn(req, res) {
  const session = getUserSession(req);
  if (!session) {
    res.status(401).json({ error: "not_logged_in" });
    return;
  }

  const supabase = getSupabase();

  const [{ data: applications, error: appsError }, { data: donations, error: donationsError }] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("discord_id", session.discordId)
      .order("created_at", { ascending: false }),
    supabase
      .from("donation_codes")
      .select("*")
      .eq("discord_id", session.discordId)
      .order("created_at", { ascending: false }),
  ]);

  if (appsError || donationsError) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  res.status(200).json({ applications: applications || [], donations: donations || [] });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    await getOwn(req, res);
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const session = getUserSession(req);
  if (!session) {
    res.status(401).json({ error: "not_logged_in" });
    return;
  }

  const { category, answers } = req.body || {};
  if (!VALID_CATEGORIES.includes(category) || typeof answers !== "object" || !answers) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const supabase = getSupabase();

  const { data: setting } = await supabase
    .from("category_settings")
    .select("enabled")
    .eq("category", category)
    .single();

  if (!setting || !setting.enabled) {
    res.status(403).json({ error: "category_disabled" });
    return;
  }

  const { error } = await supabase.from("applications").insert({
    discord_id: session.discordId,
    discord_username: session.discordUsername,
    category,
    answers,
  });

  if (error) {
    res.status(500).json({ error: "insert_failed" });
    return;
  }

  res.status(200).json({ ok: true });
}
