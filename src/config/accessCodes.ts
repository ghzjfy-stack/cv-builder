export function isValidAccessCode(input: string): boolean {
  const digits = String(input || "").replace(/\D/g, "");
  return digits.length === 4 && Number(digits) === 1000 + 9;
}
