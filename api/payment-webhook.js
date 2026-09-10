import { handlePaymentWebhookRequest } from "../server/paymentWebhook.js";

export const config = {
  maxDuration: 15,
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    await handlePaymentWebhookRequest(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
    }
  }
}
