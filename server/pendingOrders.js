import { kvDel, kvGet, kvSet } from "./kv.js";

const PENDING_TTL_SEC = () => Math.max(3600, Number(process.env.CODE_TTL_SECONDS || 30 * 24 * 60 * 60));

function pendingKey(orderId) {
  return `qc:pending:${String(orderId || "").trim()}`;
}

/**
 * @param {object} order
 * @param {string|number} order.orderId
 * @param {number} [order.orderNumber]
 * @param {string} [order.customerName]
 * @param {string} [order.phone]
 * @param {string} [order.email]
 * @param {string} [order.paymentMethod]
 * @param {number} [order.amountIls]
 * @param {string} [order.verificationCode]
 * @param {string} [order.pack]
 * @param {string} [order.provider]
 * @param {string} [order.transactionId]
 */
export async function savePendingOrder(order) {
  const orderId = String(order.orderId || order.orderNumber || "").trim();
  if (!orderId) return null;
  const record = {
    order_id: orderId,
    order_number: Number(order.orderNumber) || Number(orderId) || 0,
    customer_name: String(order.customerName || "").trim(),
    phone: String(order.phone || "").trim(),
    email: String(order.email || "").trim(),
    payment_method: String(order.paymentMethod || order.provider || "").trim(),
    amount_ils: Number(order.amountIls) || 0,
    verification_code: String(order.verificationCode || "").trim(),
    pack: order.pack === "complete" ? "complete" : "basic",
    provider: String(order.provider || "").trim(),
    transaction_id: String(order.transactionId || "").trim(),
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await kvSet(pendingKey(orderId), record, PENDING_TTL_SEC());
  return record;
}

export async function getPendingOrder(orderId) {
  const record = await kvGet(pendingKey(orderId));
  if (!record || typeof record !== "object") return null;
  return record;
}

export async function updatePendingOrder(orderId, patch) {
  const current = await getPendingOrder(orderId);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  await kvSet(pendingKey(orderId), next, PENDING_TTL_SEC());
  return next;
}

export async function deletePendingOrder(orderId) {
  await kvDel(pendingKey(orderId));
}

export function detectPackFromAmount(amountIls) {
  const amount = Number(amountIls);
  const complete = Number(process.env.PAYMENT_PACK_COMPLETE_ILS || 10);
  const bump = Number(process.env.COVER_LETTER_BUMP_ILS || 0);
  const basic = Number(process.env.PAYMENT_AMOUNT_ILS || 10);
  if (!Number.isFinite(amount)) return "basic";
  if (Math.abs(amount - complete) <= 0.51) return "complete";
  if (Math.abs(amount - (basic + bump)) <= 0.51) return "complete";
  if (amount >= complete - 0.51) return "complete";
  return "basic";
}
