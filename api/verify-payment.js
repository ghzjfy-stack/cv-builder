import { handleVerifyPaymentRequest } from "../server/verifyPayment.js";

export const config = {
  maxDuration: 30,
  api: {
    bodyParser: {
      sizeLimit: "6mb",
    },
  },
};

export default async function handler(req, res) {
  try {
    await handleVerifyPaymentRequest(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, is_valid: false, error: "Internal server error" }));
    }
  }
}
