import { createOAuthState } from "../lib/session.js";

export default function handler(req, res) {
  const state = createOAuthState(res, "google");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `https://${req.headers.host}/api/google-callback`,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  });
  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  res.end();
}
