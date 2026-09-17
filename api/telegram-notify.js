import { handleOrderSessionRequest } from "../server/manualCheckout.js";

export const config = {
  maxDuration: 15,
};

/** POST /api/telegram-notify — create/reuse a pending order and notify Telegram (order id, phone, Bit/PayBox). */
export default async function handler(req, res) {
  try {
    await handleOrderSessionRequest(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
    }
  }
}
