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
  payboxPayUrl: "https://www.paybox.co.il/",
  payboxCardUrl: "https://www.paybox.co.il/",
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

export function bitDeepLink(total = CHECKOUT.amountIls) {
  const amount = Math.round(Number(total) || CHECKOUT.amountIls);
  return `bitapp://send?phone=${encodeURIComponent(CHECKOUT.bitPhoneCopy)}&amount=${amount}`;
}

export function payboxDeepLink(total = CHECKOUT.amountIls) {
  const amount = Math.round(Number(total) || CHECKOUT.amountIls);
  return `paybox://send?phone=${encodeURIComponent(CHECKOUT.bitPhoneCopy)}&amount=${amount}`;
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

export function bitWebPayUrl(total = CHECKOUT.amountIls) {
  return `https://${bitSendPath(total)}`;
}

export function bitQrPayload(total = CHECKOUT.amountIls) {
  return `${CHECKOUT.bitPhoneCopy}\n${CHECKOUT.bitPhoneIntl}\n${bitWebPayUrl(total)}`;
}

export function bitPayUrl(total = CHECKOUT.amountIls) {
  const data = encodeURIComponent(bitWebPayUrl(total));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&ecc=M`;
}

export function bitAppOpenUrl(total = CHECKOUT.amountIls) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod|Android/i.test(ua)) {
    return bitDeepLink(total);
  }
  return bitWebPayUrl(total);
}

export function payboxAppOpenUrl(total = CHECKOUT.amountIls) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod|Android/i.test(ua)) {
    return payboxDeepLink(total);
  }
  return CHECKOUT.payboxPayUrl;
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
