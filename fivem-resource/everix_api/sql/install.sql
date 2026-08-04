-- Run once in phpMyAdmin (main ESX database, not the phones one).
-- Maps a player's identifier to their Discord ID, since FiveM only exposes
-- that live while the player is connected - this persists it so the Discord
-- bot can look up vehicles/phone for someone even while they're offline.

CREATE TABLE IF NOT EXISTS everix_discord_links (
  identifier VARCHAR(60) NOT NULL PRIMARY KEY,
  discord_id VARCHAR(32) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_everix_discord_links_discord ON everix_discord_links (discord_id);
