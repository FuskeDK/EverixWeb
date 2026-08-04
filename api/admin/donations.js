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
    .from("donation_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  const donations = data || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {
    totalAllTime: 0,
    totalThisMonth: 0,
    countAllTime: donations.length,
    unusedCodes: 0,
    byTier: {},
  };

  donations.forEach((d) => {
    stats.totalAllTime += d.amount_kr || 0;
    if (new Date(d.created_at) >= monthStart) stats.totalThisMonth += d.amount_kr || 0;
    if (d.status === "unused") stats.unusedCodes += 1;
    stats.byTier[d.tier] = (stats.byTier[d.tier] || 0) + 1;
  });

  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true });

  stats.activeSubscriptions = activeSubscriptions || 0;

  res.status(200).json({ donations, stats });
}
