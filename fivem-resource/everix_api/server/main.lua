-- Exposes a small authenticated HTTP API on the FiveM server's own HTTP port
-- (the one players already connect through - no new port to open), so the
-- Discord bot can look up owned vehicles and change a plate/phone number
-- without needing direct MySQL access to this server.
--
-- IMPORTANT: verify table/column names against your actual database before
-- relying on this - written from what was described, not tested against a
-- live server. The phone endpoint especially (phones.phones.phoneNumber) is
-- a guess at standard lb-phone naming and may need adjusting.

local API_KEY = GetConvar('everix_api_key', '')

local function jsonResponse(res, status, data)
  res.writeHead(status, { ['Content-Type'] = 'application/json' })
  res.send(json.encode(data))
end

local function parseQuery(path)
  local params = {}
  local queryString = path:match('%?(.*)$')
  if not queryString then return params end
  for pair in queryString:gmatch('[^&]+') do
    local key, value = pair:match('([^=]+)=(.*)')
    if key then params[key] = value end
  end
  return params
end

local function isAuthorized(req)
  return API_KEY ~= '' and req.headers['x-api-key'] == API_KEY
end

local function readBody(req, cb)
  req.setDataHandler(function(body)
    local ok, data = pcall(json.decode, body)
    cb(ok and data or nil)
  end)
end

SetHttpHandler(function(req, res)
  if not isAuthorized(req) then
    jsonResponse(res, 401, { error = 'unauthorized' })
    return
  end

  local path = req.path:match('^([^?]*)') or req.path

  if path == '/everix/vehicles' and req.method == 'GET' then
    local params = parseQuery(req.path)
    local discordId = params.discord
    if not discordId then
      jsonResponse(res, 400, { error = 'missing_discord' })
      return
    end

    local link = MySQL.single.await('SELECT identifier FROM everix_discord_links WHERE discord_id = ?', { discordId })
    if not link then
      jsonResponse(res, 404, { error = 'no_linked_player' })
      return
    end

    local vehicles = MySQL.query.await(
      "SELECT id, plate, vehicle FROM Owned_vehicles WHERE owner LIKE CONCAT('char%:', ?)",
      { link.identifier }
    )
    jsonResponse(res, 200, { vehicles = vehicles or {} })
    return
  end

  if path == '/everix/set-plate' and req.method == 'POST' then
    readBody(req, function(body)
      if not body or not body.vehicleId or not body.newPlate or not body.discordId then
        jsonResponse(res, 400, { error = 'invalid_payload' })
        return
      end

      local link = MySQL.single.await('SELECT identifier FROM everix_discord_links WHERE discord_id = ?', { body.discordId })
      if not link then
        jsonResponse(res, 404, { error = 'no_linked_player' })
        return
      end

      local vehicle = MySQL.single.await(
        "SELECT id FROM Owned_vehicles WHERE id = ? AND owner LIKE CONCAT('char%:', ?)",
        { body.vehicleId, link.identifier }
      )
      if not vehicle then
        jsonResponse(res, 403, { error = 'not_owner' })
        return
      end

      local taken = MySQL.single.await('SELECT id FROM Owned_vehicles WHERE plate = ?', { body.newPlate })
      if taken then
        jsonResponse(res, 409, { error = 'plate_taken' })
        return
      end

      MySQL.update.await('UPDATE Owned_vehicles SET plate = ? WHERE id = ?', { body.newPlate, body.vehicleId })
      jsonResponse(res, 200, { ok = true })
    end)
    return
  end

  if path == '/everix/set-phone' and req.method == 'POST' then
    readBody(req, function(body)
      if not body or not body.newNumber or not body.discordId then
        jsonResponse(res, 400, { error = 'invalid_payload' })
        return
      end

      local link = MySQL.single.await('SELECT identifier FROM everix_discord_links WHERE discord_id = ?', { body.discordId })
      if not link then
        jsonResponse(res, 404, { error = 'no_linked_player' })
        return
      end

      -- NOTE: verify this table/column name against your lb-phone install.
      local taken = MySQL.single.await('SELECT id FROM phones.phones WHERE phoneNumber = ?', { body.newNumber })
      if taken then
        jsonResponse(res, 409, { error = 'number_taken' })
        return
      end

      local affected = MySQL.update.await(
        "UPDATE phones.phones SET phoneNumber = ? WHERE identifier LIKE CONCAT('char%:', ?)",
        { body.newNumber, link.identifier }
      )
      if affected == 0 then
        jsonResponse(res, 404, { error = 'no_phone_found' })
        return
      end

      jsonResponse(res, 200, { ok = true })
    end)
    return
  end

  jsonResponse(res, 404, { error = 'not_found' })
end)

-- Records identifier <-> Discord ID whenever a player loads in, so the API
-- above can look someone up even while they're offline.
AddEventHandler('esx:playerLoaded', function(playerId, xPlayer)
  local discordIdentifier = GetPlayerIdentifierByType(playerId, 'discord')
  if not discordIdentifier then return end
  local discordId = discordIdentifier:gsub('discord:', '')

  MySQL.insert(
    'INSERT INTO everix_discord_links (identifier, discord_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE discord_id = VALUES(discord_id)',
    { xPlayer.identifier, discordId }
  )
end)
