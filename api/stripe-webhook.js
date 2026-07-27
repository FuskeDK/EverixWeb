import crypto from "node:crypto";
import { addRoleToUser } from "../lib/discord.js";

export const config = { api: { bodyParser: false } };

const TIER_ROLES = {
  spark: "1531015542322761820",
  flame: "1531015546043371642",
  blaze: "1531015550212374698",
  inferno: "1531352677903241338",
  custom: "1531352811055354127",
};

const AMOUNT_TIER = { 2900: "spark", 5900: "flame", 9900: "blaze", 14900: "inferno" };

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
    }
  }

  res.status(200).json({ received: true });
}
