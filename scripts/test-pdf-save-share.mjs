/**
 * Verifies mobile PDF download prefers Web Share (Save to Files)
 * and never auto-opens a blob viewer tab.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.QC_BASE || "http://127.0.0.1:5175/";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});

const context = await browser.newContext({
  ...devices["iPhone 13"],
  locale: "he-IL",
});
const page = await context.newPage();

const opens = [];
await page.addInitScript(() => {
  const realOpen = window.open.bind(window);
  window.open = (...args) => {
    window.__qcOpenCalls = (window.__qcOpenCalls || []).concat([String(args[0] || "")]);
    // Still allow non-blob opens if needed, but record everything.
    if (String(args[0] || "").startsWith("blob:")) return null;
    return realOpen(...args);
  };

  // First share attempt fails (lost gesture); later succeed.
  let shareCalls = 0;
  const file = { name: "x.pdf", type: "application/pdf" };
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: (data) => !!(data && data.files && data.files.length),
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async (data) => {
      shareCalls += 1;
      window.__qcShareCalls = shareCalls;
      window.__qcLastShare = {
        files: (data?.files || []).map((f) => f.name),
        title: data?.title || "",
      };
      if (shareCalls === 1) {
        const err = new Error("Share must be called from a user gesture");
        err.name = "NotAllowedError";
        throw err;
      }
    },
  });

  // Unlock paid session before app boot reads storage.
  const until = Date.now() + 24 * 60 * 60 * 1000;
  localStorage.setItem("quickcv_paid_until", String(until));
  sessionStorage.setItem("quickcv.highResUnlocked", "1");
});

await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

// Ensure unlock + paid UI
await page.evaluate(() => {
  const until = Date.now() + 24 * 60 * 60 * 1000;
  localStorage.setItem("quickcv_paid_until", String(until));
  window.QCIsPaid = true;
  window.QCPaidUntil = until;
  document.body.classList.add("paid");
  document.documentElement.classList.add("qc-paid");
  document.getElementById("cv-preview-wrapper")?.classList.add("paid");
});

// Open payment modal download step if needed and click green button
const green = page.locator("#btn-download-cv-pdf");
const mobileCta = page.locator("#btn-download-pdf-mobile");

// Prefer triggering export via QCHighResPdf after opening modal download UI
await page.evaluate(() => {
  if (typeof window.openPaymentModal === "function") window.openPaymentModal();
});
await page.waitForTimeout(500);

// Force show download step elements
await page.evaluate(() => {
  const modal = document.getElementById("payment-modal");
  modal?.classList.remove("hidden");
  modal?.classList.add("flex");
  document.getElementById("pay-step")?.classList.add("hidden");
  document.getElementById("download-step")?.classList.remove("hidden");
});

const btnVisible = await green.isVisible().catch(() => false);
if (!btnVisible) {
  // Fall back to direct export API
  console.log("green button not visible — calling QCHighResPdf directly");
}

const result = await page.evaluate(async () => {
  if (!window.QCHighResPdf) return { ok: false, reason: "no QCHighResPdf" };
  try {
    await window.QCHighResPdf();
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
  const btn = document.getElementById("btn-download-cv-pdf");
  return {
    ok: true,
    shareCalls: window.__qcShareCalls || 0,
    openCalls: window.__qcOpenCalls || [],
    pending: !!window.__qcPendingPdfShare,
    btnText: (btn?.textContent || "").trim(),
    status: (document.getElementById("download-status")?.textContent || "").trim(),
  };
});

console.log("after first export:", JSON.stringify(result, null, 2));

if (!result.ok) {
  console.error("FAIL export", result);
  process.exit(1);
}

const blobOpens = (result.openCalls || []).filter((u) => u.startsWith("blob:"));
if (blobOpens.length) {
  console.error("FAIL: window.open was called with blob URL", blobOpens);
  process.exit(1);
}

if (result.shareCalls < 1) {
  console.error("FAIL: navigator.share was never attempted");
  process.exit(1);
}

if (!result.pending) {
  console.error("FAIL: expected pending share after NotAllowedError");
  process.exit(1);
}

if (!/שמור PDF בקבצים|Save PDF to Files/i.test(result.btnText)) {
  console.error("FAIL: green button not re-labeled for Save to Files:", result.btnText);
  process.exit(1);
}

// Second tap: click the green Save button (bypasses form gate when pending share exists).
await page.locator("#btn-download-cv-pdf").click();
await page.waitForTimeout(800);
const second = await page.evaluate(() => ({
  consumed: (window.__qcShareCalls || 0) >= 2 && !window.__qcPendingPdfShare,
  shareCalls: window.__qcShareCalls || 0,
  openCalls: window.__qcOpenCalls || [],
  pending: !!window.__qcPendingPdfShare,
  lastShare: window.__qcLastShare || null,
  btnText: (document.getElementById("btn-download-cv-pdf")?.textContent || "").trim(),
}));

console.log("after pending share consume:", JSON.stringify(second, null, 2));

const blobOpens2 = (second.openCalls || []).filter((u) => u.startsWith("blob:"));
if (blobOpens2.length) {
  console.error("FAIL: window.open blob after second share", blobOpens2);
  process.exit(1);
}

if (!second.consumed || second.shareCalls < 2 || second.pending) {
  console.error("FAIL: pending share did not complete via share sheet");
  process.exit(1);
}

console.log("PASS: mobile PDF uses Save-to-Files share path; no blob viewer open");
await browser.close();
process.exit(0);
