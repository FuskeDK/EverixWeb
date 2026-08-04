import { getAdminSession } from "../../lib/session.js";
import { getSupabase } from "../../lib/supabase.js";

async function getDonations(supabase, res) {
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

async function getApplications(supabase, res) {
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

async function getSubscriptions(supabase, res) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  res.status(200).json({ subscriptions: data || [] });
}

async function getIdentifiers(supabase, res) {
  const { data, error } = await supabase
    .from("custom_identifiers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  res.status(200).json({ identifiers: data || [] });
}

async function getTickets(supabase, res) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  res.status(200).json({ tickets: data || [] });
}

async function cancelSubscription(supabase, res, id) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", id)
    .maybeSingle();

  if (!sub) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  try {
    const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.STRIPE_SECRET_KEY}:`).toString("base64")}` },
    });
    if (!stripeRes.ok) throw new Error(`Stripe error: ${stripeRes.status}`);
  } catch {
    res.status(500).json({ error: "stripe_cancel_failed" });
    return;
  }

  await supabase.from("subscriptions").delete().eq("stripe_subscription_id", id);
  res.status(200).json({ ok: true });
}

async function releaseIdentifier(supabase, res, id) {
  const { error } = await supabase.from("custom_identifiers").delete().eq("id", id);
  if (error) {
    res.status(500).json({ error: "delete_failed" });
    return;
  }
  res.status(200).json({ ok: true });
}

async function closeTicket(supabase, res, id) {
  const { error } = await supabase
    .from("tickets")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    res.status(500).json({ error: "update_failed" });
    return;
  }
  res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  if (!getAdminSession(req)) {
    res.status(401).json({ error: "not_admin" });
    return;
  }

  const supabase = getSupabase();
  const resource = req.query.resource;

  if (req.method === "GET") {
    if (resource === "donations") return getDonations(supabase, res);
    if (resource === "subscriptions") return getSubscriptions(supabase, res);
    if (resource === "identifiers") return getIdentifiers(supabase, res);
    if (resource === "tickets") return getTickets(supabase, res);
    return getApplications(supabase, res);
  }

  if (req.method === "POST") {
    const { action, id } = req.body || {};
    if (resource === "subscriptions" && action === "cancel" && id) return cancelSubscription(supabase, res, id);
    if (resource === "identifiers" && action === "release" && id) return releaseIdentifier(supabase, res, id);
    if (resource === "tickets" && action === "close" && id) return closeTicket(supabase, res, id);
    res.status(400).json({ error: "invalid_action" });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
