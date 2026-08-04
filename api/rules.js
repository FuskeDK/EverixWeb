import { getAdminSession } from "../lib/session.js";
import { getSupabase } from "../lib/supabase.js";

const GROUP_TABLE = "rule_groups";
const ITEM_TABLE = "rules";

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === "GET") {
    const { data: groups, error: groupsError } = await supabase
      .from(GROUP_TABLE)
      .select("id, name, code, note, position")
      .order("position", { ascending: true });

    if (groupsError) {
      res.status(500).json({ error: "fetch_failed" });
      return;
    }

    const { data: rules, error: rulesError } = await supabase
      .from(ITEM_TABLE)
      .select("id, group_id, title, body, position")
      .order("position", { ascending: true });

    if (rulesError) {
      res.status(500).json({ error: "fetch_failed" });
      return;
    }

    const result = groups.map((g) => ({
      ...g,
      rules: rules.filter((r) => r.group_id === g.id),
    }));

    res.status(200).json({ groups: result });
    return;
  }

  // All mutations are admin-only - rules aren't category-scoped.
  if (!getAdminSession(req)) {
    res.status(401).json({ error: "not_admin" });
    return;
  }

  const { kind } = req.body || {};
  const table = kind === "group" ? GROUP_TABLE : kind === "item" ? ITEM_TABLE : null;

  if (!table) {
    res.status(400).json({ error: "invalid_kind" });
    return;
  }

  if (req.method === "POST") {
    const { fields } = req.body;
    if (!fields || typeof fields !== "object") {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }
    const { data, error } = await supabase.from(table).insert(fields).select().single();
    if (error) {
      res.status(500).json({ error: "insert_failed" });
      return;
    }
    res.status(200).json({ ok: true, row: data });
    return;
  }

  if (req.method === "PUT") {
    const { id, fields } = req.body;
    if (!id || !fields || typeof fields !== "object") {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }
    const { error } = await supabase.from(table).update(fields).eq("id", id);
    if (error) {
      res.status(500).json({ error: "update_failed" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      res.status(500).json({ error: "delete_failed" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
