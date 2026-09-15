import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { orderStorageMode } from "./orderStore.js";
import { packAmount } from "../src/config/checkout.js";
import {
  approveManualOrder,
  createManualOrder,
  getManualOrder,
  normalizeOrderId,
  sendManualOrderTelegram,
} from "./manualOrders.js";
import {
  getSupabaseOrder,
  isAccessExpired,
  isDownloadAllowed,
  isRejectedRow,
  isSupabaseConfigured,
} from "./supabaseOrders.js";

const MAX_BYTES = 32 * 1024;

function parseContact(raw) {
  const contact = String(raw || "").trim().slice(0, 120);
  if (!contact) return { contact: "", phone: "", email: "" };
  if (contact.includes("@")) return { contact, phone: "", email: contact };
  return { contact, phone: contact, email: "" };
}

function friendlyError(err) {
  const msg = String(err?.message || err || "");
  if (/kv|redis|upstash|storage|database/i.test(msg)) {
    return "לא הצלחנו לפתוח הזמנה. נסו שוב בעוד רגע.";
  }
  return "לא הצלחנו לפתוח הזמנה. נסו שוב.";
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
      storage: orderStorageMode(),
    });
  } catch (err) {
    console.error("[quickcv] order-session failed:", err?.message || err);
    json(res, 500, { ok: false, error: friendlyError(err) });
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

  let order = null;
  try {
    order = await getManualOrder(orderId);
  } catch (err) {
    console.warn("[quickcv] order-status read failed:", err?.message || err);
    // Soft pending — never surface storage errors to the checkout UI.
    json(res, 200, { ok: true, order_id: orderId, status: "PENDING", paid: false });
    return;
  }

  let supabaseRow = null;
  if (isSupabaseConfigured()) {
    try {
      supabaseRow = await getSupabaseOrder(orderId);
    } catch (err) {
      console.warn("[quickcv] supabase order-status read failed:", err?.message || err);
    }
  }

  if (isRejectedRow(supabaseRow) || order?.status === "CANCELLED") {
    json(res, 200, {
      ok: true,
      order_id: orderId,
      status: "CANCELLED",
      paid: false,
      confirm: "no",
    });
    return;
  }

  if (isAccessExpired(supabaseRow)) {
    json(res, 200, {
      ok: true,
      order_id: orderId,
      status: "EXPIRED",
      paid: false,
      confirm: "yes",
    });
    return;
  }

  const confirmedYes = isDownloadAllowed(supabaseRow);
  if (confirmedYes && order?.status !== "PAID") {
    try {
      const approved = await approveManualOrder(orderId);
      if (approved.ok) order = approved.order;
    } catch (err) {
      console.warn("[quickcv] supabase confirm sync failed:", err?.message || err);
    }
  }

  if (!order) {
    // Keep the spinner waiting instead of failing the UX while approve propagates.
    json(res, 200, { ok: true, order_id: orderId, status: "PENDING", paid: false });
    return;
  }

  const supabaseBlocks = isRejectedRow(supabaseRow) || isAccessExpired(supabaseRow);
  const paid = Boolean((confirmedYes || order.status === "PAID") && !supabaseBlocks);
  json(res, 200, {
    ok: true,
    order_id: order.order_id,
    status: paid ? "PAID" : order.status,
    paid,
    confirm: paid ? "yes" : supabaseRow?.confirm || order.confirm || "no",
    amount_ils: order.amount_ils,
    pack: order.pack,
    ...(paid && order.unlock_token ? { token: order.unlock_token } : {}),
  });
}

/** Used by Telegram webhook approve button. */
export async function releaseManualOrderDownload(orderId) {
  const { approveManualOrder } = await import("./manualOrders.js");
  return approveManualOrder(orderId);
}
