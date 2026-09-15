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
};

export const REF_CODE_KEY = "quickcv.refCode";
export const REF_FROM_KEY = "quickcv.referredBy";

export function isPackId(value) {
  return value === "basic" || value === "complete";
}

export function packAmount(_pack) {
  return CHECKOUT.amountIls;
}

export function formatIls(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "10";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function displayAmountValue(amount = CHECKOUT.amountIls) {
  return formatIls(amount);
}

export function displayCompareValue() {
  return String(Math.round(CHECKOUT.compareAtIls));
}

export function bitAmountValue(total = CHECKOUT.amountIls) {
  return Number(total).toFixed(2);
}

export function bitSendPath(total = CHECKOUT.amountIls) {
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
export function bitWebPayUrl(total = CHECKOUT.amountIls) {
  return `https://${bitSendPath(total)}`;
}

/** Safari-safe PayBox https URL with phone + amount hints. */
export function payboxWebPayUrl(total = CHECKOUT.amountIls) {
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

/** Alias — always https Bit web URL (Safari rejects bitapp://). */
export function bitDeepLink(total = CHECKOUT.amountIls) {
  return bitWebPayUrl(total);
}

/** Alias — always https PayBox URL (Safari rejects paybox://). */
export function payboxDeepLink(total = CHECKOUT.amountIls) {
  return payboxWebPayUrl(total);
}

export function bitQrPayload(total = CHECKOUT.amountIls) {
  return `${CHECKOUT.bitPhoneCopy}\n${CHECKOUT.bitPhoneIntl}\n${bitWebPayUrl(total)}`;
}

export function bitPayUrl(total = CHECKOUT.amountIls) {
  const data = encodeURIComponent(bitWebPayUrl(total));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&ecc=M`;
}

/** Always open Bit via https (web/app bridge). */
export function bitAppOpenUrl(total = CHECKOUT.amountIls) {
  return bitWebPayUrl(total);
}

/** Always open PayBox via fully-qualified https URL. */
export function payboxAppOpenUrl(total = CHECKOUT.amountIls) {
  return payboxWebPayUrl(total);
}

export function whatsappPaymentMessage(total = CHECKOUT.amountIls) {
  const shown = displayAmountValue(total);
  return `היי, שילמתי ${shown} ש"ח ב-Bit עבור קורות החיים.`;
}

export function whatsappUrl(total = CHECKOUT.amountIls) {
  return `https://wa.me/${CHECKOUT.whatsappNumber}?text=${encodeURIComponent(whatsappPaymentMessage(total))}`;
}

export function whatsappPdfShareUrl(phoneDigits, text) {
  const to = String(phoneDigits || "").replace(/\D/g, "");
  const base = to ? `https://wa.me/${to}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function referralShareText(url) {
  return `היי, בניתי קורות חיים ב-QuickCV ב-${displayAmountValue(CHECKOUT.amountIls)} ₪. שווה לנסות: ${url}`;
}

export function whatsappReferralUrl(url) {
  return `https://wa.me/?text=${encodeURIComponent(referralShareText(url))}`;
}

export function isLikelyIsraeliMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (/^9725\d{8}$/.test(digits)) return true;
  if (/^05\d{8}$/.test(digits)) return true;
  if (/^5\d{8}$/.test(digits)) return true;
  return false;
}
