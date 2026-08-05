# Everix Discord bot (presence + ticket system)

This standalone script does two things the website's Vercel serverless
functions can't:

1. **Stays online** - shows the bot as online in Discord (requires a
   persistent Gateway connection, which serverless functions can't hold).
2. **Runs the ticket system** - a button panel with 8 categories (Generelt,
   Donation, Bande, Firma, Unban, Kompensation, CK, Development). Opening a
   "Donation" ticket asks for the receipt code from the `/tak` page first;
   other categories open directly. Only the ticket's opener and staff (role
   `1531015608404279296`) can see a ticket's channel.

Role grants and DMs for applications/donations still happen separately in
the website's Vercel functions, using the same bot token - this script does
not duplicate that.

## Required environment variables

| Variable | Value |
|---|---|
| `DISCORD_BOT_TOKEN` | Same token as in Vercel |
| `SUPABASE_URL` | Same as the website's `SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as the website's `SUPABASE_SERVICE_ROLE_KEY` |
| `TICKET_PARENT_CATEGORY_ID` | Optional - a Discord category ID to nest new ticket channels under. Leave unset to create them at the top level. |

## Bot permissions needed (in addition to what's already set up)

- **Manage Channels** - to create/delete ticket channels
- **Manage Roles** stays needed for the website's role grants (already set up)
- Bot's own role must still sit above any role it manages in the hierarchy

## One-time setup after deploying

Run `/ticketpanel` once, in the ticket channel (`1531015902429057085`), as a
user with the staff role. This posts the category-selection panel. It only
needs to be run again if that message gets deleted.

## Database

This needs 4 tables in Supabase: `donation_codes`, `donation_code_perks`,
`subscriptions`, `tickets`. See `../supabase/migrations/ticket_system.sql` -
run that once in the Supabase SQL Editor before starting the bot.

## Deploying to Bot-Hosting.net (or a similar free Node bot host)

1. Create a Node.js server/instance there (Node 18+).
2. Delete whatever default template files it comes with (`index.js`,
   `package.json`, etc. from its own starter bot) - upload these instead:
   - `discord-bot/index.js`
   - `discord-bot/package.json`
3. Set the environment variables above in the panel's **Env** tab (not
   Startup - that's for the run command). If the panel writes them into a
   `.env` file on disk rather than injecting real process env vars (some
   hosts do this), that's fine - `index.js` loads `dotenv/config` on startup
   specifically to read that file.
4. Startup command: `npm install && npm start`.
5. Start the server. Console should print `Logged in as <bot-name>` and
   `Slash commands registered.`
6. Run `/ticketpanel` once as described above.

## Running it yourself instead (e.g. on a PC or VM)

```
cd discord-bot
npm install
DISCORD_BOT_TOKEN=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm start
```
