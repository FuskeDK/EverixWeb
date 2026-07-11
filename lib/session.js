import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function sign(payload) {
  if (!SECRET) throw new Error("SESSION_SECRET is not set");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token) {
  if (!SECRET || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  });
  return out;
}

export function buildCookie(name, value, { maxAge } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax"];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function appendSetCookie(res, cookie) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookie]);
  } else {
    res.setHeader("Set-Cookie", [existing, cookie]);
  }
}

const USER_COOKIE = "everix_session";
const ADMIN_COOKIE = "everix_admin";
const STATE_COOKIE_PREFIX = "everix_oauth_state_";

export function createUserSession(res, { discordId, discordUsername }) {
  const token = sign({ discordId, discordUsername, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  appendSetCookie(res, buildCookie(USER_COOKIE, token, { maxAge: MAX_AGE_SECONDS }));
}

export function getUserSession(req) {
  const cookies = parseCookies(req);
  const payload = verify(cookies[USER_COOKIE]);
  if (!payload || !payload.discordId) return null;
  return payload;
}

export function clearUserSession(res) {
  appendSetCookie(res, clearCookie(USER_COOKIE));
}

export function createAdminSession(res, { email }) {
  const token = sign({ email, isAdmin: true, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  appendSetCookie(res, buildCookie(ADMIN_COOKIE, token, { maxAge: MAX_AGE_SECONDS }));
}

export function isAllowedAdminEmail(email) {
  const allowed = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email) && allowed.includes(email.toLowerCase());
}

export function getAdminSession(req) {
  const cookies = parseCookies(req);
  const payload = verify(cookies[ADMIN_COOKIE]);
  if (!payload || !payload.isAdmin || !isAllowedAdminEmail(payload.email)) return null;
  return payload;
}

export function clearAdminSession(res) {
  appendSetCookie(res, clearCookie(ADMIN_COOKIE));
}

export function createOAuthState(res, key) {
  const state = crypto.randomBytes(16).toString("hex");
  appendSetCookie(res, buildCookie(STATE_COOKIE_PREFIX + key, state, { maxAge: 600 }));
  return state;
}

export function verifyOAuthState(req, res, key, receivedState) {
  const cookies = parseCookies(req);
  const expected = cookies[STATE_COOKIE_PREFIX + key];
  appendSetCookie(res, clearCookie(STATE_COOKIE_PREFIX + key));
  return Boolean(expected) && expected === receivedState;
}
