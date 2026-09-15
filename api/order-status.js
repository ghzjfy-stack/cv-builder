import { handleOrderStatusRequest } from "../server/manualCheckout.js";

export const config = {
  maxDuration: 10,
};

export default async function handler(req, res) {
  try {
    await handleOrderStatusRequest(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
    }
  }
}
