import { getUserSession } from "../lib/session.js";
import { getStaffCategories } from "../lib/roles.js";

export default async function handler(req, res) {
  const session = getUserSession(req);
  if (!session) {
    res.status(200).json({ loggedIn: false, categories: [] });
    return;
  }
  const categories = await getStaffCategories(req);
  res.status(200).json({ loggedIn: true, username: session.discordUsername, categories });
}
