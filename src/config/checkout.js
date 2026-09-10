/** Configure once: WhatsApp (international, no +) and Bit display/copy numbers. */
export const CHECKOUT = {
  amountIls: 9.9,
  compareAtIls: 49,
  coverLetterBumpIls: 10,
  packCompleteIls: 19.9,
  whatsappNumber: "972543554888",
  bitPhoneDisplay: "054-3554888",
  bitPhoneCopy: "0543554888",
  bitPhoneIntl: "972543554888",
  bitAppUrl: "https://www.bitpay.co.il/app/",
  payboxPayUrl: "https://www.paybox.co.il/",
  payboxCardUrl: "https://www.paybox.co.il/",
  whatsappMessage:
    'היי, שילמתי 9.90 ש"ח ב-Bit עבור קורות החיים. מצרף צילום מסך לקבלת קוד האימות.',
};

export const REF_CODE_KEY = "quickcv.refCode";
export const REF_FROM_KEY = "quickcv.referredBy";

export function isPackId(value) {
  return value === "basic" || value === "complete";
}

export function packAmount(pack) {
  return pack === "complete" ? CHECKOUT.packCompleteIls : CHECKOUT.amountIls;
}

export function formatIls(amount) {
  const n = Number(amount);
  return Number.isInteger(n) ? String(n) : Number(n).toFixed(2);
}

/** Shown on the site (e.g. 9.90). */
export function displayAmountValue(amount = CHECKOUT.amountIls) {
  return Number(amount).toFixed(2);
}

export function displayCompareValue() {
  return String(Math.round(CHECKOUT.compareAtIls));
}

/** Bit's send screen expects two-decimal ILS (e.g. 9.90). */
export function bitAmountValue(total = CHECKOUT.amountIls) {
  return Number(total).toFixed(2);
}

/** Path Bit's app expects when opening a P2P send (phone + amount). */
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

/** QR payload: phone in local + intl form so Bit can resolve the payee. */
export function bitQrPayload(total = CHECKOUT.amountIls) {
  return `${CHECKOUT.bitPhoneCopy}\n${CHECKOUT.bitPhoneIntl}\n${bitWebPayUrl(total)}`;
}

export function bitPayUrl(total = CHECKOUT.amountIls) {
  const data = encodeURIComponent(bitWebPayUrl(total));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&ecc=M`;
}

export function bitAppOpenUrl(total = CHECKOUT.amountIls) {
  const path = bitSendPath(total);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return `paymentsBIT://${path}`;
  }
  if (/Android/i.test(ua)) {
    return `intent://${path}#Intent;scheme=bit;package=com.bnhp.payments.paymentsapp;S.browser_fallback_url=${encodeURIComponent(bitWebPayUrl(total))};end`;
  }
  return bitWebPayUrl(total);
}

export function whatsappPaymentMessage(total = CHECKOUT.amountIls) {
  const shown = displayAmountValue(total);
  return `היי, שילמתי ${shown} ש"ח ב-Bit עבור קורות החיים. מצרף צילום מסך לקבלת קוד האימות.`;
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

export function checkoutTotalIls(includeBump) {
  return includeBump ? CHECKOUT.packCompleteIls : CHECKOUT.amountIls;
}
