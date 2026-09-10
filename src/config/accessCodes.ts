/** Local format check only. Real codes are issued after payment and verified on the server. */
export function isSixDigitCode(input: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(String(input || "").replace(/[^A-Za-z0-9]/g, ""));
}
