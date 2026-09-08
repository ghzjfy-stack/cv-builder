export const VERIFY_FAIL_MSG =
  "Payment screenshot could not be verified. Please make sure the transfer of 9.9 ILS to 054-3554888 is clearly visible.";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 1600;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_failed"));
    img.src = src;
  });
}

async function compressIfNeeded(file) {
  const dataUrl = await readAsDataUrl(file);
  if (file.size <= 900 * 1024) {
    return { imageBase64: dataUrl, mimeType: file.type || "image/jpeg" };
  }
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return { imageBase64: dataUrl, mimeType: file.type || "image/jpeg" };
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const jpeg = canvas.toDataURL("image/jpeg", 0.82);
    return { imageBase64: jpeg, mimeType: "image/jpeg" };
  } catch {
    return { imageBase64: dataUrl, mimeType: file.type || "image/jpeg" };
  }
}

export async function verifyPaymentScreenshot(file) {
  if (!file || !file.type.startsWith("image/")) {
    return { ok: false, is_valid: false, error: VERIFY_FAIL_MSG };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, is_valid: false, error: VERIFY_FAIL_MSG };
  }

  const body = await compressIfNeeded(file);
  const res = await fetch("/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!data || typeof data !== "object") {
    return { ok: false, is_valid: false, error: VERIFY_FAIL_MSG };
  }
  return data;
}
