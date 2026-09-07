/** Configure once: WhatsApp (international, no +) and Bit display/copy numbers. */
export const CHECKOUT = {
  amountIls: 10,
  whatsappNumber: "972543554888",
  bitPhoneDisplay: "054-3554888",
  bitPhoneCopy: "0543554888",
  bitAppUrl: "https://www.bitpay.co.il/app/",
  whatsappMessage:
    'היי, שילמתי 10 ש"ח ב-Bit עבור קורות החיים. מצרף צילום מסך לקבלת קוד האימות.',
} as const;

export function bitPayUrl(): string {
  const data = encodeURIComponent(CHECKOUT.bitPhoneCopy);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}`;
}

export function whatsappUrl(): string {
  return `https://wa.me/${CHECKOUT.whatsappNumber}?text=${encodeURIComponent(CHECKOUT.whatsappMessage)}`;
}
