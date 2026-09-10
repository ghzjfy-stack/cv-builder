import { consumeCode } from "./codes.js";
import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { TOKEN_TTL_MS, signUnlockToken } from "./unlockToken.js";

const MAX_BYTES = 8 * 1024;
const FAIL_MSG = "קוד שגוי או שפג תוקפו. בדקו את ההודעה שקיבלתם לאחר התשלום.";

function failReasonMessage(reason) {
  if (reason === "expired") return "פג תוקף הקוד. אם שילמתם, פנו לתמיכה לקבלת קוד חדש.";
  if (reason === "used") return "הקוד כבר שומש. כל קוד תקף להורדה אחת.";
  return FAIL_MSG;
}

/**
 * POST /api/verify-code-and-download
 * Body: { code: "123456", contact?: phone|email }
 *
 * CV PDFs are generated in the browser from the live preview. After a valid
 * one-time code this route returns a short-lived unlock token; the client
 * then streams the high-res PDF download locally.
 */
export async function handleVerifyCodeAndDownloadRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "POST") {
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const ip = clientIp(req);
  if (rateLimited(`code:${ip}`, 10, 10 * 60 * 1000)) {
    json(res, 429, { ok: false, error: "Too many attempts. Please wait a few minutes." });
    return;
  }

  let payload;
  try {
    const raw = await readBody(req, MAX_BYTES);
    payload = parseBody(raw, req.headers["content-type"] || "application/json");
  } catch {
    json(res, 400, { ok: false, error: FAIL_MSG });
    return;
  }
  if (!payload || typeof payload !== "object") {
    json(res, 400, { ok: false, error: FAIL_MSG });
    return;
  }

  const result = await consumeCode(payload.code, payload.contact || payload.phone || payload.email || "");
  if (!result.ok) {
    json(res, 200, {
      ok: false,
      error: failReasonMessage(result.reason),
      reason: result.reason,
    });
    return;
  }

  const token = signUnlockToken();
  json(res, 200, {
    ok: true,
    is_paid: true,
    is_used: true,
    token,
    expiresInSec: Math.floor(TOKEN_TTL_MS / 1000),
    download: {
      authorized: true,
      mode: "client",
      filename_hint: "resume.pdf",
    },
  });
}
