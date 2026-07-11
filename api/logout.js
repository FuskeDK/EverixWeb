import { clearUserSession } from "../lib/session.js";

export default function handler(req, res) {
  clearUserSession(res);
  res.writeHead(302, { Location: "/ansog" });
  res.end();
}
