export type CvAiParseResult = {
  ok: boolean;
  action?: string;
  cv?: Record<string, string>;
  text?: string;
  error?: string;
};

const FAIL_HE = "שירות ה-AI לא הגיב. נסו שוב בעוד רגע.";
const FAIL_EN = "The AI service did not respond. Please try again.";

function failForLang(lang?: string) {
  return String(lang || "").toLowerCase().startsWith("en") ? FAIL_EN : FAIL_HE;
}

export async function requestCvAi(
  action: "parse" | "polish",
  payload: { text: string; lang?: string; context?: string },
): Promise<CvAiParseResult> {
  const lang = payload.lang === "en" ? "en" : "he";
  try {
    const res = await fetch("/api/cv-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        text: String(payload.text || ""),
        lang,
        context: payload.context || "",
      }),
    });
    let data: CvAiParseResult | null = null;
    try {
      data = (await res.json()) as CvAiParseResult;
    } catch {
      data = null;
    }
    if (!data || typeof data !== "object") {
      return { ok: false, error: failForLang(lang) };
    }
    if (res.status === 429) {
      return { ok: false, error: data.error || failForLang(lang) };
    }
    return data;
  } catch {
    return { ok: false, error: failForLang(lang) };
  }
}
