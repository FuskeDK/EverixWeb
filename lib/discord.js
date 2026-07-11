const API = "https://discord.com/api/v10";

export async function exchangeDiscordCode(code, redirectUri) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Discord token exchange failed: ${res.status}`);
  return res.json();
}

export async function getDiscordUser(accessToken) {
  const res = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Discord user fetch failed: ${res.status}`);
  return res.json();
}

async function botFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  return res;
}

export async function sendDiscordDM(discordUserId, content) {
  const dmChannel = await botFetch("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: discordUserId }),
  });
  if (!dmChannel.ok) throw new Error(`Could not open DM channel: ${dmChannel.status}`);
  const { id: channelId } = await dmChannel.json();

  const message = await botFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!message.ok) throw new Error(`Could not send DM: ${message.status}`);
}

export async function addDiscordRole(discordUserId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_ROLE_ID_AFVENTER;
  const res = await botFetch(`/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error(`Could not add role: ${res.status}`);
}
