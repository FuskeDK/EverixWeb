import { getSupabase } from "../lib/supabase.js";
import { hasCategoryAccess, CATEGORY_ROLES } from "../lib/roles.js";

const VALID_CATEGORIES = Object.keys(CATEGORY_ROLES);

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("category_settings").select("category, enabled");
    if (error) {
      res.status(500).json({ error: "fetch_failed" });
      return;
    }
    const settings = {};
    data.forEach((row) => {
      settings[row.category] = row.enabled;
    });
    res.status(200).json(settings);
    return;
  }

  if (req.method === "PUT") {
    const { category, enabled } = req.body || {};
    if (!VALID_CATEGORIES.includes(category) || typeof enabled !== "boolean") {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }

    const allowed = await hasCategoryAccess(req, category);
    if (!allowed) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const { error } = await supabase.from("category_settings").update({ enabled }).eq("category", category);
    if (error) {
      res.status(500).json({ error: "update_failed" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
