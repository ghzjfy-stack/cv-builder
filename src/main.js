import { isUnlocked, unlock, WRONG_CODE_MSG } from "./access/gate.js";
import { CHECKOUT, whatsappUrl } from "./config/checkout.js";
import { exportHighResPdf } from "./pdf/exportHighRes.js";

const modal = () => document.getElementById("payment-modal");
const feedback = () => document.getElementById("code-feedback");
const codeInput = () => document.getElementById("download-code");
const preview = () => document.getElementById("cv-preview-wrapper");

function setFeedback(text, ok) {
  const el = feedback();
  if (!el) return;
  el.textContent = text;
  el.className = `text-sm min-h-5 text-center font-semibold ${ok ? "text-emerald-300" : "text-rose-400"}`;
}

function showPayStep() {
  document.getElementById("pay-step")?.classList.remove("hidden");
  document.getElementById("download-step")?.classList.add("hidden");
}

function showDownloadStep() {
  document.getElementById("pay-step")?.classList.add("hidden");
  document.getElementById("download-step")?.classList.remove("hidden");
  preview()?.classList.add("paid");
}

function openModal() {
  const el = modal();
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("flex");
  el.style.display = "flex";
  el.style.zIndex = "9999";
  el.style.pointerEvents = "auto";
}

function closeModal() {
  const el = modal();
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("flex");
  el.style.display = "none";
}

function flashCopyButton() {
  const btn = document.getElementById("btn-copy-bit");
  if (!btn) return;
  btn.textContent = "הועתק";
  setTimeout(() => {
    btn.textContent = "העתק מספר";
  }, 1600);
}

function copyBitPhone(e) {
  e?.preventDefault?.();
  void navigator.clipboard.writeText(CHECKOUT.bitPhoneCopy).then(flashCopyButton, flashCopyButton);
}

function openBitApp(e) {
  e?.preventDefault?.();
  window.open(CHECKOUT.bitAppUrl, "_blank", "noopener");
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
    if (userCode !== "1009") {
      setFeedback(WRONG_CODE_MSG, false);
      return;
    }
    window.QCRateLimit?.reset();
    window.QCLog?.add("auth_ok", "verified");
    unlock();
  }

  preview()?.classList.add("paid");
  closeModal();
  void runHighResExport();
}

function openCheckoutModal() {
  openModal();
  showPayStep();
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
  const amount = document.getElementById("bit-amount");
  if (amount) amount.textContent = String(CHECKOUT.amountIls);
}

function restoreUnlockUi() {
  if (isUnlocked()) preview()?.classList.add("paid");
}

function styleCta(el) {
  if (!el) return;
  el.removeAttribute("disabled");
  el.style.pointerEvents = "auto";
  el.style.zIndex = "9999";
}

function bind() {
  fillCheckoutUi();
  restoreUnlockUi();
  document.getElementById("pdf-spinner")?.classList.add("hidden");
  document.getElementById("pdf-spinner")?.classList.remove("flex");

  window.openPaymentModal = openCheckoutModal;
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

  document.getElementById("btn-close-modal")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });
  document.getElementById("btn-open-bit")?.addEventListener("click", openBitApp);
  document.getElementById("btn-copy-bit")?.addEventListener("click", copyBitPhone);
  document.getElementById("btn-whatsapp")?.addEventListener("click", openWhatsApp);
  document.getElementById("verify-btn")?.addEventListener("click", verifyAndUnlock);

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
    if (e.target === modal()) closeModal();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind);
} else {
  bind();
}
