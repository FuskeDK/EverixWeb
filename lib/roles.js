import { getUserSession, getAdminSession } from "./session.js";
import { getGuildMemberRoles } from "./discord.js";

export const CATEGORY_ROLES = {
  Politi: "1358770808670916668",
  EMS: "1358770808620716091",
  Firma: "1358770808708923494",
  Bande: "1358770808708923495",
  Allowlist: "1358770808708923493",
};

export async function hasCategoryAccess(req, category) {
  if (getAdminSession(req)) return true;

  const roleId = CATEGORY_ROLES[category];
  if (!roleId) return false;

  const session = getUserSession(req);
  if (!session) return false;

  const roles = await getGuildMemberRoles(session.discordId);
  return roles.includes(roleId);
}
