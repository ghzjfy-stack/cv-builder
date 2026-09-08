/** Configure once: WhatsApp (international, no +) and Bit display/copy numbers. */
export const CHECKOUT = {
  amountIls: 9.9,
  compareAtIls: 39.9,
  whatsappNumber: "972543554888",
  bitPhoneDisplay: "054-3554888",
  bitPhoneCopy: "0543554888",
  bitPhoneIntl: "972543554888",
  bitAppUrl: "https://www.bitpay.co.il/app/",
  whatsappMessage:
    'היי, שילמתי 9.9 ש"ח ב-Bit עבור קורות החיים. מצרף צילום מסך לקבלת קוד האימות.',
};

/** Shown on the site (e.g. 9.9). */
export function displayAmountValue() {
  return String(CHECKOUT.amountIls);
}

/** Bit's send screen expects two-decimal ILS (e.g. 9.90). */
export function bitAmountValue() {
  return Number(CHECKOUT.amountIls).toFixed(2);
}

/** Path Bit's app expects when opening a P2P send (phone + amount). */
export function bitSendPath() {
  const phone = CHECKOUT.bitPhoneCopy;
  const amount = bitAmountValue();
  const query = [
    `phone=${encodeURIComponent(phone)}`,
    `phoneNumber=${encodeURIComponent(phone)}`,
    `sum=${encodeURIComponent(amount)}`,
    `amount=${encodeURIComponent(amount)}`,
  ].join("&");
  return `www.bitpay.co.il/app/?${query}`;
}

export function bitWebPayUrl() {
  return `https://${bitSendPath()}`;
}

/** QR payload: phone in local + intl form so Bit can resolve the payee. */
export function bitQrPayload() {
  return `${CHECKOUT.bitPhoneCopy}\n${CHECKOUT.bitPhoneIntl}\n${bitWebPayUrl()}`;
}

export function bitPayUrl() {
  const data = encodeURIComponent(bitWebPayUrl());
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&ecc=M`;
}

export function bitAppOpenUrl() {
  const path = bitSendPath();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return `paymentsBIT://${path}`;
  }
  if (/Android/i.test(ua)) {
    return `intent://${path}#Intent;scheme=bit;package=com.bnhp.payments.paymentsapp;S.browser_fallback_url=${encodeURIComponent(bitWebPayUrl())};end`;
  }
  return bitWebPayUrl();
}

export function whatsappUrl() {
  return `https://wa.me/${CHECKOUT.whatsappNumber}?text=${encodeURIComponent(CHECKOUT.whatsappMessage)}`;
}
