import { Client, GatewayIntentBits, ActivityType } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  client.user.setPresence({
    status: "online",
    activities: [{ name: "everix-chi.vercel.app", type: ActivityType.Watching }],
  });
  console.log(`Logged in as ${client.user.tag} - presence set to online.`);
});

client.on("error", (err) => console.error("Client error:", err));

client.login(process.env.DISCORD_BOT_TOKEN);
