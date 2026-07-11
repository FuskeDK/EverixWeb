import { getAdminSession } from "../../../../lib/session.js";
import { getSupabase } from "../../../../lib/supabase.js";
import { sendDiscordDM, addDiscordRole } from "../../../../lib/discord.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const admin = getAdminSession(req);
  if (!admin) {
    res.status(401).json({ error: "not_admin" });
    return;
  }

  const { id } = req.query;
  const { action } = req.body || {};
  if (action !== "approve" && action !== "reject") {
    res.status(400).json({ error: "invalid_action" });
    return;
  }

  const supabase = getSupabase();
  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !application) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const status = action === "approve" ? "approved" : "rejected";

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: admin.email })
    .eq("id", id);

  if (updateError) {
    res.status(500).json({ error: "update_failed" });
    return;
  }

  const dmMessage =
    action === "approve"
      ? `Din ansøgning til **${application.category}** på Everix er blevet godkendt! Du får snart en besked om næste skridt.`
      : `Din ansøgning til **${application.category}** på Everix er desværre blevet afvist.`;

  try {
    await sendDiscordDM(application.discord_id, dmMessage);
  } catch {
    // DM can fail if the user has DMs closed - don't block the decision on it.
  }

  if (action === "approve") {
    try {
      await addDiscordRole(application.discord_id);
    } catch (err) {
      res.status(200).json({ ok: true, warning: "role_grant_failed" });
      return;
    }
  }

  res.status(200).json({ ok: true });
}
