import { getUserSession } from "../lib/session.js";
import { getSupabase } from "../lib/supabase.js";
import { CATEGORY_ROLES } from "../lib/roles.js";

const VALID_CATEGORIES = Object.keys(CATEGORY_ROLES);

export default async function handler(req, res) {
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
