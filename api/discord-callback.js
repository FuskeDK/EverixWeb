import { verifyOAuthState, createUserSession } from "../lib/session.js";
import { exchangeDiscordCode, getDiscordUser } from "../lib/discord.js";

const REDIRECT_URI = "https://everix-chi.vercel.app/api/discord-callback";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state || !verifyOAuthState(req, res, "discord", state)) {
    res.writeHead(302, { Location: "/ansog?error=login_failed" });
    res.end();
    return;
  }

  try {
    const tokens = await exchangeDiscordCode(code, REDIRECT_URI);
    const user = await getDiscordUser(tokens.access_token);

    createUserSession(res, {
      discordId: user.id,
      discordUsername: user.username,
    });

    res.writeHead(302, { Location: "/ansog" });
    res.end();
  } catch (err) {
    res.writeHead(302, { Location: "/ansog?error=login_failed" });
    res.end();
  }
}
