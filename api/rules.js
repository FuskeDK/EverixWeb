import { getSupabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const supabase = getSupabase();

  const { data: groups, error: groupsError } = await supabase
    .from("rule_groups")
    .select("id, name, code, note, position")
    .order("position", { ascending: true });

  if (groupsError) {
    res.status(500).json({ error: "fetch_failed" });
    return;
  }

  const { data: rules, error: rulesError } = await supabase
    .from("rules")
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
}
