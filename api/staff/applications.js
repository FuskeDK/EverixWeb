import { getSupabase } from "../../lib/supabase.js";
import { hasCategoryAccess, CATEGORY_ROLES } from "../../lib/roles.js";

const VALID_CATEGORIES = Object.keys(CATEGORY_ROLES);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { category } = req.query;
  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: "invalid_category" });
    return;
  }

  const allowed = await hasCategoryAccess(req, category);
  if (!allowed) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  res.status(200).json({ applications: data });
}
