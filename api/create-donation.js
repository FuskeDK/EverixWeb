import { getUserSession } from "../lib/session.js";
import { getSupabase } from "../lib/supabase.js";

const MIN_KR = 10;
const MAX_KR = 10000;
const PRODUCT_ID = "prod_Uxp4hNmefznZEB";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { session_id } = req.query;
    if (!session_id) {
      res.status(400).json({ error: "missing_session_id" });
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase
      .from("donation_codes")
      .select("code, tier, amount_kr, frequency")
      .eq("stripe_session_id", session_id)
      .maybeSingle();
    if (!data) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.status(200).json(data);
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

  const { amount, frequency } = req.body || {};
  const kr = Math.floor(Number(amount));

  if (!Number.isFinite(kr) || kr < MIN_KR || kr > MAX_KR) {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }
  if (frequency !== "month" && frequency !== "once") {
    res.status(400).json({ error: "invalid_frequency" });
    return;
  }

  const params = new URLSearchParams({
    mode: frequency === "month" ? "subscription" : "payment",
    success_url: "https://everixrp.vercel.app/tak?tier=custom&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://everixrp.vercel.app/donation",
    "line_items[0][price_data][currency]": "dkk",
    "line_items[0][price_data][unit_amount]": String(kr * 100),
    "line_items[0][price_data][product]": PRODUCT_ID,
    "line_items[0][quantity]": "1",
    "client_reference_id": session.discordId,
    "metadata[tier]": "custom",
  });
  if (frequency === "month") {
    params.set("line_items[0][price_data][recurring][interval]", "month");
  }

  try {
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.STRIPE_SECRET_KEY}:`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!stripeRes.ok) throw new Error(`Stripe error: ${stripeRes.status}`);
    const session_ = await stripeRes.json();
    res.status(200).json({ url: session_.url });
  } catch (err) {
    res.status(500).json({ error: "stripe_failed" });
  }
}
