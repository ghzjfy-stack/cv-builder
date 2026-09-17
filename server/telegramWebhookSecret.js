/** Telegram X-Telegram-Bot-Api-Secret-Token. Keep in sync with the Edge Function. */
export const TELEGRAM_WEBHOOK_SECRET_FALLBACK =
  "qc_tg_wh_v1_b7e1c4a08d3f9a2c6e5b1d8f0a4c7e29";

export function telegramWebhookSecret() {
  try {
    return String(process.env.TELEGRAM_WEBHOOK_SECRET || TELEGRAM_WEBHOOK_SECRET_FALLBACK).trim();
  } catch {
    return TELEGRAM_WEBHOOK_SECRET_FALLBACK;
  }
}
