import { sendTelegramOrderNotification } from "../lib/telegram.js";
import { allocateOrderNumber } from "./orders.js";
import { detectPackFromAmount, savePendingOrder } from "./pendingOrders.js";

/**
 * Allocate a sequential order number, store a pending order, and notify Telegram
 * with Confirm / Delete buttons. Email is sent only after admin Confirm.
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
 * @param {string} [input.pack]
 */
export async function notifyPaidOrder(input) {
  try {
    const orderNumber = await allocateOrderNumber(input.provider, input.transactionId);
    const orderId = String(orderNumber);
    const pack =
      input.pack === "complete" || input.pack === "basic"
        ? input.pack
        : detectPackFromAmount(input.amountIls);

    await savePendingOrder({
      orderId,
      orderNumber,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      paymentMethod: input.paymentMethod || input.provider || "",
      amountIls: Number(input.amountIls) || 0,
      verificationCode: input.verificationCode || "",
      pack,
      provider: input.provider || "",
      transactionId: input.transactionId || "",
    });

    const result = await sendTelegramOrderNotification({
      orderNumber,
      orderId,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      paymentMethod: input.paymentMethod || input.provider || "",
      amountIls: Number(input.amountIls) || 0,
      verificationCode: input.verificationCode || "",
      pack,
      timestamp: new Date(),
    });
    if (!result.sent && result.error && result.error !== "not_configured") {
      console.error("[quickcv] Telegram order notification failed:", result.error);
    }
    return { orderNumber, orderId, pack, ...result };
  } catch (err) {
    console.error("[quickcv] Telegram order notification failed:", err?.message || err);
    return { sent: false, error: "notify_failed", orderNumber: 0 };
  }
}
