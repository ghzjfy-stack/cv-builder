/** Configure once: WhatsApp (international, no +) and Bit display/copy numbers. */
export const CHECKOUT = {
  amountIls: 5,
  compareAtIls: 29,
  whatsappNumber: "972543554888",
  bitPhoneDisplay: "054-3554888",
  bitPhoneCopy: "0543554888",
  bitPhoneIntl: "972543554888",
  bitAppUrl: "https://www.bitpay.co.il/app/",
  whatsappMessage:
    'היי, שילמתי 5 ש"ח ב-Bit עבור קורות החיים. מצרף צילום מסך לקבלת קוד האימות.',
};

/** Path Bit's app expects when opening a P2P send (phone + amount). */
export function bitSendPath() {
  const phone = CHECKOUT.bitPhoneCopy;
  const amount = String(CHECKOUT.amountIls);
  return `www.bitpay.co.il/app/?phone=${encodeURIComponent(phone)}&amount=${encodeURIComponent(amount)}`;
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
    return `intent://${path}#Intent;scheme=bit;package=com.bnhp.payments.paymentsapp;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.bnhp.payments.paymentsapp;end`;
  }
  return bitWebPayUrl();
}

export function whatsappUrl() {
  return `https://wa.me/${CHECKOUT.whatsappNumber}?text=${encodeURIComponent(CHECKOUT.whatsappMessage)}`;
}
