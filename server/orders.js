import { kvGet, kvIncr, kvSetNx } from "./kv.js";

const ORDER_SEQ_KEY = "qc:order:seq";
const ORDER_START = () => {
  const n = Number(process.env.ORDER_SEQ_START || 1000);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 1000;
};

function txOrderKey(provider, transactionId) {
  const providerId = String(provider || "unknown").slice(0, 40);
  const txId = String(transactionId || "").slice(0, 120);
  return `qc:order:tx:${providerId}:${txId}`;
}

/**
 * Unique sequential order number (#1001, #1002, …).
 * Idempotent per provider + transaction so webhook retries do not skip extra numbers.
 *
 * @param {string} [provider]
 * @param {string} [transactionId]
 * @returns {Promise<number>}
 */
export async function allocateOrderNumber(provider = "", transactionId = "") {
  const txId = String(transactionId || "").trim();
  const key = txId ? txOrderKey(provider, txId) : "";

  if (key) {
    const existing = Number(await kvGet(key));
    if (Number.isInteger(existing) && existing > 0) return existing;
  }

  const next = ORDER_START() + (await kvIncr(ORDER_SEQ_KEY));

  if (key) {
    const created = await kvSetNx(key, next);
    if (!created) {
      const winner = Number(await kvGet(key));
      if (Number.isInteger(winner) && winner > 0) return winner;
    }
  }

  return next;
}
