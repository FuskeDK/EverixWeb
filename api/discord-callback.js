import { verifyOAuthState, createUserSession } from "../lib/session.js";
import { exchangeDiscordCode, getDiscordUser } from "../lib/discord.js";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state || !verifyOAuthState(req, res, "discord", state)) {
    res.writeHead(302, { Location: "/ansog?error=login_failed" });
    res.end();
    return;
  }

  try {
    const redirectUri = `https://${req.headers.host}/api/discord-callback`;
    const tokens = await exchangeDiscordCode(code, redirectUri);
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
