# everix_api

A small FiveM resource that exposes an authenticated HTTP API on your
server's own HTTP port (the same one players connect through - no new port
needs opening), so the Everix Discord bot can look up a donor's owned
vehicles and change a plate/phone number, without needing MySQL open to
the internet.

**Not tested against a live server** - written from a description of your
`users` and `Owned_vehicles` tables, not direct access. Check the notes
below before trusting it in production, especially the phone endpoint.

## Install

1. Copy this `everix_api` folder into your server's `resources/` directory.
2. Requires [`oxmysql`](https://overextended.dev/oxmysql) as a dependency
   (already listed in `fxmanifest.lua`) - make sure it's installed and
   started before this resource.
3. Run `sql/install.sql` once in phpMyAdmin, on the same database as your
   `users`/`Owned_vehicles` tables. It only adds one small table
   (`everix_discord_links`) - nothing existing is touched.
4. In your `server.cfg`, add:
   ```
   ensure oxmysql
   ensure everix_api
   setr everix_api_key "generate-a-long-random-string-here"
   ```
5. Restart the server (or `refresh` + `ensure everix_api` if adding live).

## Give me these two things once it's running

1. **The API key** you set above (the `everix_api_key` value).
2. **Your server's public address + port** that the API is reachable at,
   e.g. `http://your-server-ip:30120` (FiveM's HTTP handler runs on the same
   port as the game connection, so this is usually already open/reachable -
   unlike MySQL's port).

I'll wire the Discord bot to call `http://<that address>/everix/vehicles`,
`/everix/set-plate`, and `/everix/set-phone` using the API key as a header.

## Things to verify before it's reliable

- **`Owned_vehicles.owner` format**: written assuming values look like
  `char1:<identifier>`, `char2:<identifier>`, etc. (multiple characters per
  license). If your actual format is different, the `LIKE CONCAT('char%:', ?)`
  matches in `server/main.lua` need adjusting.
- **`phones.phones` columns**: `phoneNumber` and `identifier` are standard
  lb-phone naming, but confirm in phpMyAdmin - if your columns are named
  differently, update the two queries in the `/everix/set-phone` handler.
- **Discord ID capture**: only happens when a player is *already* using
  Discord as an identifier method on your server (most servers do). It
  records the link the next time that donor plays after this resource is
  installed - if they donated before ever loading in again, their vehicles
  won't be found until they log in once.
