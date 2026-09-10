export const CODE_FAIL_MSG = "קוד שגוי או שפג תוקפו. בדקו את ההודעה שקיבלתם לאחר התשלום.";

export type VerifyCodeResponse = {
  ok?: boolean;
  token?: string;
  error?: string;
  reason?: string;
  download?: {
    authorized?: boolean;
    mode?: string;
  };
};

export async function verifyDownloadCode(code: string, contact = ""): Promise<VerifyCodeResponse> {
  const normalized = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  if (normalized.length !== 6) {
    return { ok: false, error: CODE_FAIL_MSG, reason: "invalid" };
  }

  const res = await fetch("/api/verify-code-and-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: normalized,
      contact: String(contact || "").trim(),
    }),
  });

  let data: VerifyCodeResponse | null = null;
  try {
    data = (await res.json()) as VerifyCodeResponse;
  } catch {
    data = null;
  }

  if (!data || typeof data !== "object") {
    return { ok: false, error: CODE_FAIL_MSG };
  }
  if (res.status === 429) {
    return { ok: false, error: data.error || "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." };
  }
  return data;
}
