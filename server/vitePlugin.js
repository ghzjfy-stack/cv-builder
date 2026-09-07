import { handleVerifyPaymentRequest } from "./verifyPayment.js";
import { loadEnv } from "./env.js";

function attach(middlewares) {
  middlewares.use((req, res, next) => {
    const path = (req.url || "").split("?")[0];
    if (path !== "/api/verify-payment") {
      next();
      return;
    }
    handleVerifyPaymentRequest(req, res).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, is_valid: false, error: "Internal server error" }));
      }
    });
  });
}

export function paymentApiPlugin() {
  loadEnv();
  return {
    name: "quickcv-payment-api",
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    },
  };
}
