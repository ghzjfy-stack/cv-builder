const FAIL_HE = "שירות ה-AI לא הגיב. נסו שוב בעוד רגע.";
const FAIL_EN = "The AI service did not respond. Please try again.";

function failForLang(lang) {
  return String(lang || "").toLowerCase().startsWith("en") ? FAIL_EN : FAIL_HE;
}

export async function requestCvAi(action, payload) {
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
    let data = null;
    try {
      data = await res.json();
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
