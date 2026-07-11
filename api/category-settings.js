import { getSupabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const supabase = getSupabase();
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
}
