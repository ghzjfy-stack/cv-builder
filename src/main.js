// @ts-nocheck
import { clearPersistedUnlock, isUnlocked, unlock, unlockWithPaymentToken, validateCode, WRONG_CODE_MSG } from "./access/gate.js";
import { CHECKOUT, bitAppOpenUrl, bitPayUrl, displayAmountValue, whatsappUrl } from "./config/checkout.js";
import { exportHighResPdf } from "./pdf/exportHighRes.js";
import { VERIFY_FAIL_MSG, verifyPaymentScreenshot } from "./payment/verifyScreenshot.js";

const modal = () => document.getElementById("payment-modal");
const feedback = () => document.getElementById("code-feedback");
const codeInput = () => document.getElementById("download-code");
const preview = () => document.getElementById("cv-preview-wrapper");

let lastFocus = null;

function setScreenshotFeedback(text, ok) {
  const el = document.getElementById("screenshot-feedback");
  if (!el) return;
  el.textContent = text;
  el.className = `text-sm min-h-5 text-center font-semibold ${ok ? "text-emerald-300" : "text-rose-400"}`;
}

function setVerifyOverlay(on) {
  const el = document.getElementById("payment-verify-overlay");
  if (!el) return;
  el.classList.toggle("hidden", !on);
  el.classList.toggle("flex", on);
  const input = document.getElementById("payment-screenshot");
  if (input) {
    if (on) input.setAttribute("disabled", "true");
    else input.removeAttribute("disabled");
  }
}

async function onPaymentScreenshotChange(e) {
  const input = e?.target;
  const file = input && "files" in input ? input.files?.[0] : null;
  if (!file) return;

  const nameEl = document.getElementById("payment-screenshot-name");
  if (nameEl) nameEl.textContent = file.name;

  setScreenshotFeedback("", false);
  setVerifyOverlay(true);
  try {
    const result = await verifyPaymentScreenshot(file);
    if (result && result.is_valid === true) {
      window.QCRateLimit?.reset();
      window.QCLog?.add("auth_ok", "screenshot verified");
      if (result.token) unlockWithPaymentToken(result.token);
      else unlock();
      setPaidUi(true);
      setScreenshotFeedback("התשלום אומת בהצלחה. מוריד את ה-PDF...", true);
      setFeedback("התשלום אומת בהצלחה.", true);
      showDownloadStep();
      void runHighResExport();
      return;
    }
    window.QCLog?.add("auth_fail", "screenshot rejected");
    window.QCRateLimit?.fail();
    setScreenshotFeedback(result?.error || VERIFY_FAIL_MSG, false);
  } catch {
    setScreenshotFeedback(VERIFY_FAIL_MSG, false);
  } finally {
    setVerifyOverlay(false);
    if (input && "value" in input) input.value = "";
  }
}

function setFeedback(text, ok) {
  const el = feedback();
  if (!el) return;
  el.textContent = text;
  el.className = `text-sm min-h-5 text-center font-semibold ${ok ? "text-emerald-300" : "text-rose-400"}`;
}

function setPaidUi(paid) {
  const wrap = preview();
  wrap?.classList.toggle("paid", paid);
  document.body.classList.toggle("paid", paid);
  document.documentElement.classList.toggle("qc-paid", paid);
  document.documentElement.classList.toggle("qc-unpaid", !paid);
}

function showPayStep() {
  document.getElementById("pay-step")?.classList.remove("hidden");
  document.getElementById("download-step")?.classList.add("hidden");
}

function showDownloadStep() {
  document.getElementById("pay-step")?.classList.add("hidden");
  document.getElementById("download-step")?.classList.remove("hidden");
  setPaidUi(true);
}

function trapFocus(e) {
  const el = modal();
  if (!el || el.classList.contains("hidden")) return;
  if (e.key !== "Tab") return;
  const nodes = [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
    (n) => !n.hasAttribute("disabled") && n.getClientRects().length > 0,
  );
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openModal() {
  const el = modal();
  if (!el) return;
  lastFocus = document.activeElement;
  document.body.classList.add("qc-checkout-open");
  el.classList.remove("hidden");
  el.classList.add("flex");
  el.style.display = "flex";
  el.style.zIndex = "10050";
  el.style.pointerEvents = "auto";
  el.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    document.getElementById("btn-close-modal")?.focus();
  }, 30);
}

function closeModal() {
  const el = modal();
  if (!el) return;
  document.body.classList.remove("qc-checkout-open");
  el.classList.add("hidden");
  el.classList.remove("flex");
  el.style.display = "none";
  el.setAttribute("aria-hidden", "true");
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

function dismissCheckout(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  setVerifyOverlay(false);
  closeModal();
}

function flashCopyButton() {
  const btn = document.getElementById("btn-copy-bit");
  if (!btn) return;
  const prev = btn.textContent;
  btn.textContent = "הועתק";
  setTimeout(() => {
    btn.textContent = prev || "העתק מספר";
  }, 1600);
}

function copyBitPhone(e) {
  e?.preventDefault?.();
  void navigator.clipboard.writeText(CHECKOUT.bitPhoneCopy).then(flashCopyButton, flashCopyButton);
}

function openBitApp(e) {
  const url = bitAppOpenUrl();
  const el = e?.currentTarget;
  if (el instanceof HTMLAnchorElement) {
    el.href = url;
    el.target = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "_self" : "_blank";
    return;
  }
  e?.preventDefault?.();
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    window.location.href = url;
    return;
  }
  window.open(url, "_blank", "noopener");
}

function openWhatsApp(e) {
  e?.preventDefault?.();
  window.open(whatsappUrl(), "_blank", "noopener");
}

async function runHighResExport() {
  const status = document.getElementById("download-status");
  if (status) status.textContent = "מכין קובץ PDF...";
  try {
    await exportHighResPdf();
    if (status) status.textContent = "ההורדה התחילה.";
  } catch {
    if (status) status.textContent = "ההורדה נכשלה. נסו שוב.";
  }
}

function readAccessCode() {
  const primary = document.getElementById("download-code") || document.getElementById("code-input");
  return String(primary && "value" in primary ? primary.value : "").trim();
}

function triggerPDFDownload() {
  if (!isUnlocked()) {
    const userCode = readAccessCode();
    if (!validateCode(userCode)) {
      setFeedback(WRONG_CODE_MSG, false);
      return;
    }
    window.QCRateLimit?.reset();
    window.QCLog?.add("auth_ok", "verified");
    unlock();
  }

  if (!isUnlocked()) {
    openCheckoutModal();
    return;
  }

  setPaidUi(true);
  closeModal();
  void runHighResExport();
}

function openCheckoutModal() {
  openModal();
  showPayStep();
  setVerifyOverlay(false);
  setScreenshotFeedback("", false);
  const shot = document.getElementById("payment-screenshot");
  if (shot && "value" in shot) shot.value = "";
  const nameEl = document.getElementById("payment-screenshot-name");
  if (nameEl) nameEl.textContent = "קובץ תמונה עד 4MB · אימות מיידי";
  const input = codeInput();
  if (input) {
    input.value = "";
    input.removeAttribute("disabled");
  }
  document.getElementById("verify-btn")?.removeAttribute("disabled");
  setFeedback("", false);
}

function onDownloadPdfClick(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  if (isUnlocked()) {
    triggerPDFDownload();
    return;
  }
  openCheckoutModal();
}

function verifyAndUnlock(e) {
  e?.preventDefault?.();
  triggerPDFDownload();
  if (!isUnlocked()) {
    window.QCLog?.add("auth_fail", "bad code");
    window.QCRateLimit?.fail();
  }
}

function downloadFormat(kind) {
  if (!isUnlocked()) {
    showPayStep();
    setFeedback("יש לאמת קוד לפני ההורדה.", false);
    return;
  }
  if (kind === "pdf") {
    closeModal();
    void runHighResExport();
    return;
  }
  const run = window.QCExport?.[kind];
  const status = document.getElementById("download-status");
  if (!run || !status) return;
  status.textContent = "מכין קובץ...";
  Promise.resolve(run()).then(
    () => {
      status.textContent = "ההורדה התחילה.";
    },
    () => {
      status.textContent = "ההורדה נכשלה. נסו שוב.";
    },
  );
}

function fillCheckoutUi() {
  const bitEl = document.getElementById("bit-number");
  if (bitEl) bitEl.textContent = CHECKOUT.bitPhoneDisplay;
  const amount = displayAmountValue();
  document.querySelectorAll("[data-price]").forEach((el) => {
    el.textContent = amount;
  });
  document.querySelectorAll("[data-compare-price]").forEach((el) => {
    el.textContent = String(CHECKOUT.compareAtIls);
  });
  const openBit = document.getElementById("btn-open-bit");
  if (openBit instanceof HTMLAnchorElement) {
    openBit.href = bitAppOpenUrl();
    openBit.target = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "_self" : "_blank";
    openBit.rel = "noopener";
  }
  const qr = document.getElementById("bit-qr");
  if (qr instanceof HTMLImageElement) {
    qr.src = bitPayUrl();
    qr.alt = `קוד QR לתשלום ${amount} ₪ ב-Bit`;
  }
}

function restoreUnlockUi() {
  setPaidUi(isUnlocked());
}

function styleCta(el) {
  if (!el) return;
  el.removeAttribute("disabled");
  el.style.pointerEvents = "auto";
}

function buildShieldGrid() {
  const grid = document.getElementById("cv-shield-grid");
  if (!grid || grid.childElementCount) return;
  for (let i = 0; i < 40; i++) {
    const span = document.createElement("span");
    span.textContent = "תצוגה מקדימה · QuickCV";
    grid.appendChild(span);
  }
}

function flashShotBlock() {
  if (isUnlocked()) return;
  const el = document.getElementById("shot-block");
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("flex");
  try {
    void navigator.clipboard.writeText("QuickCV — התצוגה המקדימה מוגנת עד לאחר התשלום.");
  } catch {
    /* ignore */
  }
  window.setTimeout(() => {
    el.classList.add("hidden");
    el.classList.remove("flex");
  }, 1600);
}

function isTypingTarget(el) {
  if (!el || !(el instanceof Element)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function bindPreviewGuard() {
  buildShieldGrid();
  const wrap = preview();
  if (!wrap) return;

  wrap.addEventListener("contextmenu", (e) => {
    if (!isUnlocked()) e.preventDefault();
  });
  wrap.addEventListener("copy", (e) => {
    if (isUnlocked()) return;
    e.preventDefault();
    flashShotBlock();
  });
  wrap.addEventListener("cut", (e) => {
    if (!isUnlocked()) e.preventDefault();
  });
  wrap.addEventListener("dragstart", (e) => {
    if (!isUnlocked()) e.preventDefault();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal() && !modal().classList.contains("hidden")) {
      e.preventDefault();
      dismissCheckout(e);
      return;
    }
    trapFocus(e);
    if (isUnlocked()) return;

    const key = e.key;
    const combo = (e.ctrlKey || e.metaKey) && !isTypingTarget(e.target);
    if (key === "PrintScreen") {
      e.preventDefault();
      flashShotBlock();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && ["3", "4", "5", "S"].includes(key)) {
      e.preventDefault();
      flashShotBlock();
      return;
    }
    if (combo && (key === "p" || key === "P")) {
      e.preventDefault();
      flashShotBlock();
      openCheckoutModal();
    }
  });

  window.addEventListener("beforeprint", (e) => {
    if (isUnlocked()) return;
    e.preventDefault();
    flashShotBlock();
  });
}

function bind() {
  clearPersistedUnlock();
  fillCheckoutUi();
  restoreUnlockUi();
  bindPreviewGuard();
  document.getElementById("pdf-spinner")?.classList.add("hidden");
  document.getElementById("pdf-spinner")?.classList.remove("flex");

  window.openPaymentModal = openCheckoutModal;
  window.closePaymentModal = dismissCheckout;
  window.onDownloadPdfClick = onDownloadPdfClick;
  window.triggerPDFDownload = triggerPDFDownload;

  styleCta(document.getElementById("btn-download-pdf"));
  styleCta(document.getElementById("btn-download-pdf-mobile"));

  document.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("#btn-download-pdf, #btn-download-pdf-mobile")) {
        e.preventDefault();
        e.stopPropagation();
        onDownloadPdfClick(e);
      }
    },
    true,
  );

  document.getElementById("btn-close-modal")?.addEventListener("click", dismissCheckout);
  document.querySelectorAll(".btn-back-checkout").forEach((btn) => {
    btn.addEventListener("click", dismissCheckout);
  });
  document.getElementById("btn-open-bit")?.addEventListener("click", openBitApp);
  document.getElementById("btn-copy-bit")?.addEventListener("click", copyBitPhone);
  document.getElementById("btn-whatsapp")?.addEventListener("click", openWhatsApp);
  document.getElementById("verify-btn")?.addEventListener("click", verifyAndUnlock);
  document.getElementById("payment-screenshot")?.addEventListener("change", onPaymentScreenshotChange);

  codeInput()?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      verifyAndUnlock(e);
    }
  });

  document.querySelectorAll("[data-download]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      downloadFormat(btn.dataset.download || "");
    });
  });

  modal()?.addEventListener("click", (e) => {
    if (e.target === modal()) dismissCheckout(e);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind);
} else {
  bind();
}
