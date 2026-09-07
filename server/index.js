import { createServer } from "node:http";
import { handleVerifyPaymentRequest } from "./verifyPayment.js";
import { loadEnv } from "./env.js";

loadEnv();

const PORT = Number(process.env.PORT || 8787);

createServer((req, res) => {
  const path = (req.url || "").split("?")[0];
  if (path === "/api/verify-payment") {
    handleVerifyPaymentRequest(req, res).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, is_valid: false, error: "Internal server error" }));
      }
    });
    return;
  }
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Not found" }));
}).listen(PORT, () => {
  console.log(`Payment verification API on http://localhost:${PORT}/api/verify-payment`);
});
