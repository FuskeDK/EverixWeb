import { getUserSession, getAdminSession } from "./session.js";
import { getGuildMemberRoles } from "./discord.js";

export const CATEGORY_ROLES = {
  Politi: "1531015534387265648",
  EMS: "1531015531346530344",
  Firma: "1531015576883957910",
  Bande: "1531015580067299439",
  Whitelist: "1531015573691957248",
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

export async function getStaffCategories(req) {
  const session = getUserSession(req);
  if (!session) return [];

  const roles = await getGuildMemberRoles(session.discordId);
  return Object.keys(CATEGORY_ROLES).filter((category) => roles.includes(CATEGORY_ROLES[category]));
}
