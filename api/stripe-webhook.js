import crypto from "node:crypto";
import { addRoleToUser, sendChannelMessage, sendDiscordDM } from "../lib/discord.js";
import { getSupabase } from "../lib/supabase.js";

export const config = { api: { bodyParser: false } };

const TIER_ROLES = {
  spark: "1531015542322761820",
  flame: "1531015546043371642",
  blaze: "1531015550212374698",
  inferno: "1531352677903241338",
  custom: "1531352811055354127",
};

const TIER_NAMES = { spark: "Spark", flame: "Flame", blaze: "Blaze", inferno: "Inferno" };

// perk_type: 'generic' = simple staff checkbox. 'plate'/'phone' = needs the
// vehicle/phone lookup flow in the bot, one checklist row per `count`.
const TIER_PERKS = {
  spark: [
    { label: "Spark Discord-rolle", type: "generic" },
    { label: "Prioriteret kø", type: "generic" },
    { label: "Custom nummerplade", type: "plate", count: 1 },
  ],
  flame: [
    { label: "Flame Discord-rolle", type: "generic" },
    { label: "Prioriteret kø+", type: "generic" },
    { label: "Custom nummerplade", type: "plate", count: 2 },
    { label: "Alle Spark fordele", type: "generic" },
  ],
  blaze: [
    { label: "Blaze Discord-rolle", type: "generic" },
    { label: "Prioriteret kø++", type: "generic" },
    { label: "Custom nummerplade", type: "plate", count: 3 },
    { label: "Custom telefonnummer", type: "phone", count: 1 },
    { label: "Alle Flame fordele", type: "generic" },
  ],
  inferno: [
    { label: "Custom nummerplade", type: "plate", count: 5 },
    { label: "Custom telefonnummer", type: "phone", count: 1 },
  ],
  custom: [{ label: "Anerkendelse for din støtte til serveren", type: "generic" }],
};

const AMOUNT_TIER = { 2900: "spark", 5900: "flame", 9900: "blaze", 14900: "inferno" };

const DONATION_ANNOUNCE_CHANNEL_ID = "1531015872938774659";

function generateReceiptCode() {
  return "EVX-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

async function createDonationCode(supabase, { discordId, tier, amountKr, frequency, stripeSessionId }) {
  const code = generateReceiptCode();
  const { error } = await supabase.from("donation_codes").insert({
    code,
    discord_id: discordId,
    tier,
    amount_kr: amountKr,
    frequency,
    stripe_session_id: stripeSessionId || null,
    status: "unused",
  });
  if (error) throw error;

  const perks = TIER_PERKS[tier] || [];
  const perkRows = [];
  perks.forEach((p) => {
    for (let i = 0; i < (p.count || 1); i++) {
      perkRows.push({ code, label: p.label, perk_type: p.type });
    }
  });
  if (perkRows.length) {
    await supabase.from("donation_code_perks").insert(perkRows);
  }
  return code;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function verifySignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(parts.v1);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const rawBody = await readRawBody(req);
  const sig = req.headers["stripe-signature"];
  if (!verifySignature(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    res.status(400).json({ error: "invalid_signature" });
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const supabase = getSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const discordId = session.client_reference_id;
    const tier = session.metadata?.tier || AMOUNT_TIER[session.amount_total];
    const roleId = tier && TIER_ROLES[tier];

    if (discordId && roleId) {
      try {
        await addRoleToUser(discordId, roleId);
      } catch {
        // Role grant can fail (e.g. bot's role ranked below the target role) - don't fail the webhook ack.
      }

      try {
        const message =
          tier === "custom"
            ? `Tusind tak til <@${discordId}> som har valgt at donere os ${Math.round(session.amount_total / 100)} kr!`
            : `Tusind tak til <@${discordId}> som har valgt at donere os og få **${TIER_NAMES[tier]}**!`;
        await sendChannelMessage(DONATION_ANNOUNCE_CHANNEL_ID, message);
      } catch {
        // Announcement failing shouldn't fail the webhook ack.
      }

      try {
        await createDonationCode(supabase, {
          discordId,
          tier,
          amountKr: Math.round(session.amount_total / 100),
          frequency: session.mode === "subscription" ? "month" : "once",
          stripeSessionId: session.id,
        });
      } catch {
        // If this fails, the donor won't get a receipt code shown - not fatal to the webhook ack.
      }

      if (session.mode === "subscription" && session.subscription) {
        try {
          await supabase
            .from("subscriptions")
            .upsert({ stripe_subscription_id: session.subscription, discord_id: discordId, tier });
        } catch {
          // If this fails, renewal invoices for this subscription won't be traceable back to the user.
        }
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    if (invoice.billing_reason === "subscription_cycle" && invoice.subscription) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("discord_id, tier")
        .eq("stripe_subscription_id", invoice.subscription)
        .maybeSingle();

      if (sub) {
        const roleId = TIER_ROLES[sub.tier];
        if (roleId) {
          try {
            await addRoleToUser(sub.discord_id, roleId);
          } catch {
            // Best-effort re-affirmation of the role on renewal.
          }
        }

        let newCode = null;
        try {
          newCode = await createDonationCode(supabase, {
            discordId: sub.discord_id,
            tier: sub.tier,
            amountKr: Math.round(invoice.amount_paid / 100),
            frequency: "month",
            stripeSessionId: null,
          });
        } catch {
          // If this fails, the renewal won't get a fresh code.
        }

        try {
          const tierLabel = TIER_NAMES[sub.tier] || sub.tier;
          await sendChannelMessage(
            DONATION_ANNOUNCE_CHANNEL_ID,
            `Tusind tak til <@${sub.discord_id}> for at forny sin **${tierLabel}** donation endnu en måned!`
          );
        } catch {
          // Not fatal.
        }

        if (newCode) {
          try {
            await sendDiscordDM(
              sub.discord_id,
              `Din donation er blevet fornyet for en ny måned! Din nye kvitteringskode til at indløse dine fordele på Discord er: **${newCode}**\n\nOpret en Donation-ticket og indtast koden for at få dine fordele.`
            );
          } catch {
            // DMs can fail if the user has them closed.
          }
        }
      }
    }
  }

  res.status(200).json({ received: true });
}
