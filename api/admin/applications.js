import { getAdminSession } from "../../lib/session.js";
import { getSupabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!getAdminSession(req)) {
    res.status(401).json({ error: "not_admin" });
    return;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  res.status(200).json({ applications: data });
}
