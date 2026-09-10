import { handlePayboxSessionRequest } from "../server/payboxSession.js";

export const config = {
  maxDuration: 10,
};

export default async function handler(req, res) {
  try {
    await handlePayboxSessionRequest(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
    }
  }
}
