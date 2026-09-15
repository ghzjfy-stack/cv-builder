/** MVP: single PDF package at a flat 10 ₪. */
export const CHECKOUT = {
  amountIls: 10,
  compareAtIls: 49,
  coverLetterBumpIls: 0,
  packCompleteIls: 10,
  whatsappNumber: "972543554888",
  bitPhoneDisplay: "054-3554888",
  bitPhoneCopy: "0543554888",
  bitPhoneIntl: "972543554888",
  bitAppUrl: "https://www.bitpay.co.il/app/",
  payboxPayUrl: "https://www.payboxapp.com/",
  payboxCardUrl: "https://www.payboxapp.com/",
  whatsappMessage: 'היי, שילמתי 10 ש"ח ב-Bit עבור קורות החיים.',
  packageName: "הורדת קובץ PDF מוכן להגשה",
} as const;

/** Only one sellable pack in MVP (legacy "complete" still accepted from storage). */
export type PackId = "basic" | "complete";

export const REF_CODE_KEY = "quickcv.refCode";
export const REF_FROM_KEY = "quickcv.referredBy";

export function isPackId(value: unknown): value is PackId {
  return value === "basic" || value === "complete";
}

export function packAmount(_pack?: string): number {
  return CHECKOUT.amountIls;
}

export function formatIls(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "10";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Shown on the site (e.g. 10). */
export function displayAmountValue(amount: number = CHECKOUT.amountIls): string {
  return formatIls(amount);
}

export function displayCompareValue(): string {
  return String(Math.round(CHECKOUT.compareAtIls));
}

export function bitAmountValue(total = CHECKOUT.amountIls): string {
  return Number(total).toFixed(2);
}

/** Path Bit's web/app bridge expects when opening a P2P send. */
export function bitSendPath(total = CHECKOUT.amountIls): string {
  const phone = CHECKOUT.bitPhoneCopy;
  const amount = bitAmountValue(total);
  const query = [
    `phone=${encodeURIComponent(phone)}`,
    `phoneNumber=${encodeURIComponent(phone)}`,
    `sum=${encodeURIComponent(amount)}`,
    `amount=${encodeURIComponent(amount)}`,
  ].join("&");
  return `www.bitpay.co.il/app/?${query}`;
}

/** Safari-safe Bit https request / web bridge URL (never a custom scheme). */
export function bitWebPayUrl(total = CHECKOUT.amountIls): string {
  return `https://${bitSendPath(total)}`;
}

/** Safari-safe PayBox https URL with phone + amount hints. */
export function payboxWebPayUrl(total = CHECKOUT.amountIls): string {
  const phone = CHECKOUT.bitPhoneCopy;
  const amount = bitAmountValue(total);
  const base = String(CHECKOUT.payboxPayUrl || "https://www.payboxapp.com/").replace(/\/?$/, "/");
  const query = [
    `phone=${encodeURIComponent(phone)}`,
    `phoneNumber=${encodeURIComponent(phone)}`,
    `sum=${encodeURIComponent(amount)}`,
    `amount=${encodeURIComponent(amount)}`,
  ].join("&");
  return `${base}?${query}`;
}

/** @deprecated Alias — always https Bit web URL (Safari rejects bitapp://). */
export function bitDeepLink(total = CHECKOUT.amountIls): string {
  return bitWebPayUrl(total);
}

/** @deprecated Alias — always https PayBox URL (Safari rejects paybox://). */
export function payboxDeepLink(total = CHECKOUT.amountIls): string {
  return payboxWebPayUrl(total);
}

export function bitQrPayload(total = CHECKOUT.amountIls): string {
  return `${CHECKOUT.bitPhoneCopy}\n${CHECKOUT.bitPhoneIntl}\n${bitWebPayUrl(total)}`;
}

export function bitPayUrl(total = CHECKOUT.amountIls): string {
  const data = encodeURIComponent(bitWebPayUrl(total));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&ecc=M`;
}

/** Always open Bit via https (web/app bridge). */
export function bitAppOpenUrl(total = CHECKOUT.amountIls): string {
  return bitWebPayUrl(total);
}

/** Always open PayBox via fully-qualified https URL. */
export function payboxAppOpenUrl(total = CHECKOUT.amountIls): string {
  return payboxWebPayUrl(total);
}

export function whatsappPaymentMessage(total = CHECKOUT.amountIls): string {
  const shown = displayAmountValue(total);
  return `היי, שילמתי ${shown} ש"ח ב-Bit עבור קורות החיים.`;
}

export function whatsappUrl(total = CHECKOUT.amountIls): string {
  return `https://wa.me/${CHECKOUT.whatsappNumber}?text=${encodeURIComponent(whatsappPaymentMessage(total))}`;
}

export function whatsappPdfShareUrl(phoneDigits: string, text: string): string {
  const to = String(phoneDigits || "").replace(/\D/g, "");
  const base = to ? `https://wa.me/${to}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function referralShareText(url: string): string {
  return `היי, בניתי קורות חיים ב-QuickCV ב-${displayAmountValue(CHECKOUT.amountIls)} ₪. שווה לנסות: ${url}`;
}

export function whatsappReferralUrl(url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(referralShareText(url))}`;
}

export function isLikelyIsraeliMobile(raw: string): boolean {
  const digits = String(raw || "").replace(/\D/g, "");
  if (/^9725\d{8}$/.test(digits)) return true;
  if (/^05\d{8}$/.test(digits)) return true;
  if (/^5\d{8}$/.test(digits)) return true;
  return false;
}
