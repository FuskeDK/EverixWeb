import { getUserSession, clearUserSession, clearAdminSession } from "../lib/session.js";
import { getStaffCategories } from "../lib/roles.js";

export default async function handler(req, res) {
  if (req.query.logout !== undefined) {
    clearUserSession(res);
    clearAdminSession(res);
    const returnTo = req.query.return;
    const dest = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
    res.writeHead(302, { Location: dest });
    res.end();
    return;
  }

  const session = getUserSession(req);
  if (!session) {
    res.status(200).json({ loggedIn: false, categories: [] });
    return;
  }
  const categories = await getStaffCategories(req);
  res.status(200).json({ loggedIn: true, username: session.discordUsername, discordId: session.discordId, categories });
}
