# Everix presence bot

This is a tiny, separate script whose only job is to keep the Everix Discord
bot showing **online**. It does nothing else - all the actual functionality
(DMs on application decisions, granting roles, donation announcements) stays
in the website's Vercel serverless functions, using the same bot token.

That split exists because "online" status requires a bot to stay connected
to Discord's Gateway 24/7 via a WebSocket, which serverless functions can't
do (they only run per-request, briefly). This script is the one thing that
needs to run continuously somewhere.

## Deploying to Bot-Hosting.net (or a similar free Node bot host)

1. Sign up and create a new server/bot instance, choosing the **Node.js**
   egg/environment (any recent Node 18+ version works).
2. Upload this `discord-bot/` folder's contents (`package.json`, `index.js`).
3. Set the environment variable `DISCORD_BOT_TOKEN` to the bot's token
   (same one used in the website's Vercel env vars - Developer Portal →
   Bot → Token).
4. Set the startup command to `npm install && npm start` (or install once,
   then `npm start` / `node index.js`, depending on what the panel asks for).
5. Start the server. Once it logs "presence set to online", the bot will
   show online in Discord as long as that host keeps the process running.

## Running it yourself instead (e.g. on a PC or VM)

```
cd discord-bot
npm install
DISCORD_BOT_TOKEN=your_token npm start
```

Keep the process running (e.g. with `pm2` or as a background service) -
if it stops, the bot goes offline again, though the website's own features
(DMs, roles, donation announcements) keep working regardless, since those
use direct REST calls and don't depend on this script being up.
