import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { assertKvReadyForOrders, kvIsRemote } from "./kv.js";
import { packAmount, isPackId } from "../src/config/checkout.js";
import {
  approveManualOrder,
  createManualOrder,
  getManualOrder,
  normalizeOrderId,
  sendManualOrderTelegram,
} from "./manualOrders.js";

const MAX_BYTES = 32 * 1024;

function parseContact(raw) {
  const contact = String(raw || "").trim().slice(0, 120);
  if (!contact) return { contact: "", phone: "", email: "" };
  if (contact.includes("@")) return { contact, phone: "", email: contact };
  return { contact, phone: contact, email: "" };
}

function kvErrorResponse(res, err) {
  if (err?.code === "KV_REQUIRED" || err?.code === "KV_VERIFY_FAILED") {
    json(res, 503, {
      ok: false,
      error: "אחסון ההזמנות לא מוגדר (KV). הגדירו KV_REST_API_URL ו-KV_REST_API_TOKEN ב-Vercel.",
      code: err.code,
    });
    return true;
  }
  return false;
}

/**
 * POST /api/order-session
 * Create a PENDING manual checkout order and notify Telegram.
 */
export async function handleOrderSessionRequest(req, res) {
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
  if (rateLimited(`order-session:${ip}`, 12, 10 * 60 * 1000)) {
    json(res, 429, { ok: false, error: "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." });
    return;
  }

  try {
    assertKvReadyForOrders();
  } catch (err) {
    if (kvErrorResponse(res, err)) return;
    throw err;
  }

  let body;
  try {
    const raw = await readBody(req, MAX_BYTES);
    body = parseBody(raw, req.headers["content-type"]) || {};
  } catch {
    json(res, 400, { ok: false, error: "bad_request" });
    return;
  }

  const pack = "basic";
  const methodRaw = String(body.payment_method || body.method || "bit").toLowerCase();
  const paymentMethod = methodRaw === "paybox" ? "paybox" : "bit";
  const contacts = parseContact(body.contact || body.phone || body.email);
  if (!contacts.phone) {
    json(res, 400, { ok: false, error: "נא למלא מספר טלפון לזיהוי ההעברה." });
    return;
  }
  const amountIls = Number(process.env.PAYMENT_AMOUNT_ILS || 10) || packAmount(pack);

  try {
    const order = await createManualOrder({
      customerName: body.customer_name || body.name || "",
      phone: contacts.phone || body.phone || "",
      email: contacts.email || body.email || "",
      contact: contacts.contact,
      paymentMethod,
      amountIls,
      pack,
    });

    const notify = await sendManualOrderTelegram(order);
    if (!notify.sent && notify.error && notify.error !== "not_configured") {
      console.error("[quickcv] manual order telegram failed:", notify.error);
    }

    json(res, 200, {
      ok: true,
      order_id: order.order_id,
      status: order.status,
      amount_ils: order.amount_ils,
      pack: order.pack,
      telegram_sent: Boolean(notify.sent),
      storage: kvIsRemote() ? "kv" : "memory",
    });
  } catch (err) {
    if (kvErrorResponse(res, err)) return;
    console.error("[quickcv] order-session failed:", err?.message || err);
    json(res, 500, { ok: false, error: "לא הצלחנו לפתוח הזמנה. נסו שוב." });
  }
}

/**
 * GET /api/order-status?order=CV-8492
 * Client polls until status becomes PAID (unlock token included).
 */
export async function handleOrderStatusRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "GET, OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "GET") {
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const orderId = normalizeOrderId(url.searchParams.get("order") || url.searchParams.get("id"));
  if (!orderId) {
    json(res, 400, { ok: false, error: "missing_order_id" });
    return;
  }

  try {
    assertKvReadyForOrders();
  } catch (err) {
    if (kvErrorResponse(res, err)) return;
    throw err;
  }

  let order;
  try {
    order = await getManualOrder(orderId);
  } catch (err) {
    if (kvErrorResponse(res, err)) return;
    throw err;
  }

  if (!order) {
    json(res, 404, { ok: false, paid: false, status: "NOT_FOUND", error: "order_not_found" });
    return;
  }

  const paid = order.status === "PAID";
  json(res, 200, {
    ok: true,
    order_id: order.order_id,
    status: order.status,
    paid,
    amount_ils: order.amount_ils,
    pack: order.pack,
    ...(paid && order.unlock_token ? { token: order.unlock_token } : {}),
  });
}

/** Used by Telegram webhook approve button. */
export async function releaseManualOrderDownload(orderId) {
  return approveManualOrder(orderId);
}
