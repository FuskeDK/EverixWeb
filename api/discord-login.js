import { createOAuthState } from "../lib/session.js";

export default function handler(req, res) {
  const state = createOAuthState(res, "discord");
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `https://${req.headers.host}/api/discord-callback`,
    response_type: "code",
    scope: "identify",
    state,
  });
  res.writeHead(302, { Location: `https://discord.com/api/oauth2/authorize?${params}` });
  res.end();
}
