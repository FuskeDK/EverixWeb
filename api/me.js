import { getUserSession } from "../lib/session.js";

export default function handler(req, res) {
  const session = getUserSession(req);
  if (!session) {
    res.status(200).json({ loggedIn: false });
    return;
  }
  res.status(200).json({ loggedIn: true, username: session.discordUsername });
}
