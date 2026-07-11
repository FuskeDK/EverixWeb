import { verifyOAuthState, createAdminSession, isAllowedAdminEmail } from "../lib/session.js";

const REDIRECT_URI = "https://everix-chi.vercel.app/api/google-callback";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state || !verifyOAuthState(req, res, "google", state)) {
    res.status(401).send("Login mislykkedes. Gå tilbage og prøv igen.");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) throw new Error("token exchange failed");
    const tokens = await tokenRes.json();

    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) throw new Error("userinfo failed");
    const profile = await userRes.json();

    if (!profile.email_verified || !isAllowedAdminEmail(profile.email)) {
      res.status(403).send("Denne konto har ikke adgang til admin.");
      return;
    }

    createAdminSession(res, { email: profile.email });
    res.writeHead(302, { Location: "/admin" });
    res.end();
  } catch (err) {
    res.status(401).send("Login mislykkedes. Gå tilbage og prøv igen.");
  }
}
