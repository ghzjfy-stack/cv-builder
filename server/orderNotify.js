import { sendTelegramOrderNotification } from "../lib/telegram.js";
import { allocateOrderNumber } from "./orders.js";

/**
 * Allocate a sequential order number and notify Telegram.
 * Failures are swallowed so payment webhooks always complete.
 *
 * @param {object} input
 * @param {string} [input.provider]
 * @param {string} [input.transactionId]
 * @param {string} [input.customerName]
 * @param {string} [input.phone]
 * @param {string} [input.email]
 * @param {string} [input.paymentMethod]
 * @param {number} [input.amountIls]
 * @param {string} [input.verificationCode]
 */
export async function notifyPaidOrder(input) {
  try {
    const orderNumber = await allocateOrderNumber(input.provider, input.transactionId);
    const result = await sendTelegramOrderNotification({
      orderNumber,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      paymentMethod: input.paymentMethod || input.provider || "",
      amountIls: Number(input.amountIls) || 0,
      verificationCode: input.verificationCode || "",
      timestamp: new Date(),
    });
    if (!result.sent && result.error && result.error !== "not_configured") {
      console.error("[quickcv] Telegram order notification failed:", result.error);
    }
    return { orderNumber, ...result };
  } catch (err) {
    console.error("[quickcv] Telegram order notification failed:", err?.message || err);
    return { sent: false, error: "notify_failed", orderNumber: 0 };
  }
}
