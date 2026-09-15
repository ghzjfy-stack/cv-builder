// @ts-nocheck
import { initTemplateSelector } from "./templates/selector";
import { clearPersistedUnlock, getPaymentToken, isUnlocked, unlock, unlockWithPaymentToken } from "./access/gate.js";
import {
  CHECKOUT,
  REF_CODE_KEY,
  REF_FROM_KEY,
  bitAppOpenUrl,
  displayAmountValue,
  displayCompareValue,
  isLikelyIsraeliMobile,
  isPackId,
  packAmount,
  payboxAppOpenUrl,
  whatsappPdfShareUrl,
  whatsappReferralUrl,
  type PackId,
} from "./config/checkout.js";
import { exportHighResPdf } from "./pdf/exportHighRes.js";
import {
  createManualOrderSession,
  waitForManualOrderPaid,
} from "./payment/manualOrder.js";

const modal = () => document.getElementById("payment-modal");
const feedback = () => document.getElementById("code-feedback");
const preview = () => document.getElementById("cv-preview-wrapper");
const PACK_KEY = "quickcv.checkoutPack";
const MANUAL_ORDER_KEY = "quickcv.manualOrderId";
const MANUAL_ORDER_STATE_KEY = "quickcv.manualOrderState";
const MANUAL_ORDER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let lastFocus = null;
let selectedPack: PackId = "basic";
let selectedPayMethod = "bit";
let manualOrderPoll = null;
let activeManualOrderId = "";

function normalizeStoredOrderId(value) {
  const id = String(value || "")
    .trim()
    .toUpperCase();
  return /^CV-\d{4}$/.test(id) ? id : "";
}

function persistManualOrderId(orderId, status = "PENDING") {
  activeManualOrderId = normalizeStoredOrderId(orderId);
  try {
    if (activeManualOrderId) {
      const state = {
        orderId: activeManualOrderId,
        status: String(status || "PENDING").toUpperCase(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(MANUAL_ORDER_KEY, activeManualOrderId);
      localStorage.setItem(MANUAL_ORDER_STATE_KEY, JSON.stringify(state));
      // Migrate away from older session-only storage.
      sessionStorage.removeItem(MANUAL_ORDER_KEY);
    } else {
      localStorage.removeItem(MANUAL_ORDER_KEY);
      localStorage.removeItem(MANUAL_ORDER_STATE_KEY);
      sessionStorage.removeItem(MANUAL_ORDER_KEY);
    }
  } catch {
    /* private mode / quota */
  }
}

function readPersistedManualOrderId() {
  try {
    const fromStateRaw = localStorage.getItem(MANUAL_ORDER_STATE_KEY);
    if (fromStateRaw) {
      try {
        const parsed = JSON.parse(fromStateRaw);
        const id = normalizeStoredOrderId(parsed?.orderId);
        const updatedAt = Number(parsed?.updatedAt) || 0;
        if (id && updatedAt && Date.now() - updatedAt > MANUAL_ORDER_MAX_AGE_MS) {
          persistManualOrderId("");
          return "";
        }
        if (id) return id;
      } catch {
        /* fall through */
      }
    }
    const fromLocal = normalizeStoredOrderId(localStorage.getItem(MANUAL_ORDER_KEY));
    if (fromLocal) return fromLocal;
    // One-time migration from sessionStorage.
    const fromSession = normalizeStoredOrderId(sessionStorage.getItem(MANUAL_ORDER_KEY));
    if (fromSession) {
      persistManualOrderId(fromSession, "PENDING");
      return fromSession;
    }
    return "";
  } catch {
    return "";
  }
}

function readStoredPack(): PackId {
  try {
    const stored = sessionStorage.getItem(PACK_KEY);
    if (isPackId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "basic";
}

function selectedAmount(): number {
  return packAmount(selectedPack);
}

function setSelectedPack(packId: PackId, persist = true) {
  selectedPack = "basic";
  if (persist) {
    try {
      sessionStorage.setItem(PACK_KEY, selectedPack);
    } catch {
      /* ignore */
    }
  }
  applyPackUi();
}

function setVerifyOverlay(_on, _title, _sub) {
  // Legacy overlay removed — status lives in `#pay-live-status`.
}

function updateWaitCopy() {
  /* single-step checkout: amounts come from fillCheckoutUi / data-price */
}

function showPayStep() {
  document.getElementById("pay-step")?.classList.remove("hidden");
  document.getElementById("pay-wait-step")?.classList.add("hidden");
  document.getElementById("download-step")?.classList.add("hidden");
}

function showWaitStep() {
  // MVP: keep the pay step visible (spinner + "בודק סטטוס תשלום..." live there).
  showPayStep();
}

function showDownloadStep() {
  document.getElementById("pay-step")?.classList.add("hidden");
  document.getElementById("pay-wait-step")?.classList.add("hidden");
  document.getElementById("download-step")?.classList.remove("hidden");
  document.getElementById("download-complete-note")?.classList.toggle("hidden", selectedPack !== "complete");
  document.querySelectorAll("[data-pack-extra]").forEach((el) => {
    el.classList.toggle("hidden", selectedPack !== "complete");
  });
  setPaidUi(true);
  fillReferralUi();
  const phone = readCheckoutContact();
  const waPhone = document.getElementById("wa-pdf-phone");
  if (waPhone instanceof HTMLInputElement && phone && !waPhone.value) waPhone.value = phone;
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
  if (typeof window.lockQcModalScroll === "function") {
    window.lockQcModalScroll("payment");
  } else {
    document.documentElement.classList.add("qc-modal-open");
    document.body.classList.add("qc-modal-open");
  }
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
  if (typeof window.unlockQcModalScroll === "function") {
    window.unlockQcModalScroll("payment");
  } else {
    document.documentElement.classList.remove("qc-modal-open");
    document.body.classList.remove("qc-modal-open");
  }
  el.classList.add("hidden");
  el.classList.remove("flex");
  el.style.display = "none";
  el.setAttribute("aria-hidden", "true");
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

function stopPayboxPoll() {
  /* hosted PayBox flow removed for MVP deep-link checkout */
}

function stopManualOrderPoll() {
  if (manualOrderPoll) {
    manualOrderPoll.abort();
    manualOrderPoll = null;
  }
}

function setManualOrderUi(orderId, statusText) {
  const panel = document.getElementById("manual-order-panel");
  const idEl = document.getElementById("manual-order-id");
  const statusEl = document.getElementById("manual-order-status");
  if (orderId) {
    panel?.classList.remove("hidden");
    if (idEl) idEl.textContent = orderId;
  }
  if (statusEl && statusText != null) statusEl.textContent = statusText;
}

function readCustomerName() {
  const el = document.getElementById("in-name");
  return String(el && "value" in el ? el.value : "").trim();
}

async function startManualOrderPolling(orderId, options = {}) {
  const quiet = Boolean(options.quiet);
  stopManualOrderPoll();
  persistManualOrderId(orderId, "PENDING");
  setManualOrderUi(orderId, "ממתין לאישור התשלום...");
  if (!quiet || modal()?.classList.contains("flex")) {
    showWaitStep();
  }
  manualOrderPoll = new AbortController();
  try {
    const result = await waitForManualOrderPaid(orderId, {
      signal: manualOrderPoll.signal,
      intervalMs: 2500,
    });
    if (result.paid === true && result.token) {
      window.QCLog?.add("auth_ok", "telegram approve");
      persistManualOrderId("");
      applyPaidUnlock(result.token, "התשלום אושר! מוריד את ה-PDF...");
      setManualOrderUi(orderId, "התשלום אושר — ההורדה נפתחה");
      setFeedback("התשלום אושר בהצלחה. ההורדה מתחילה.", true);
      return;
    }
    if (result.status === "CANCELLED") {
      persistManualOrderId("");
      setManualOrderUi(orderId, "ההזמנה נדחתה.");
      setFeedback("ההזמנה לא אושרה. אפשר לפתוח הזמנה חדשה.", false);
      return;
    }
    if (result.status === "EXPIRED") {
      persistManualOrderId("");
      setManualOrderUi(orderId, "פג תוקף הגישה.");
      setFeedback(result.error || "פג תוקף הגישה. יש לבצע הזמנה חדשה.", false);
      return;
    }
    if (result.error && result.error !== "cancelled") {
      const soft = /kv|redis|אחסון|database/i.test(String(result.error))
        ? "ממתין לאישור התשלום..."
        : result.error;
      setManualOrderUi(orderId, soft);
      if (!/kv|redis|אחסון|database/i.test(String(result.error))) {
        setFeedback(result.error, false);
      }
    }
  } finally {
    manualOrderPoll = null;
  }
}

function resumePendingManualOrderIfNeeded() {
  if (isUnlocked() || manualOrderPoll) return;
  const existing = readPersistedManualOrderId();
  if (!existing) return;
  void startManualOrderPolling(existing, { quiet: true });
}

function requireCheckoutPhone() {
  const contact = readCheckoutContact();
  if (!contact || !isLikelyIsraeliMobile(contact)) {
    setFeedback("נא למלא מספר טלפון תקין ב-Bit / PayBox לזיהוי ההעברה.", false);
    document.getElementById("checkout-contact")?.focus();
    return "";
  }
  return contact;
}

async function proceedToPayment(preferredMethod) {
  const contact = requireCheckoutPhone();
  if (!contact) return null;
  if (preferredMethod === "paybox" || preferredMethod === "bit") {
    selectedPayMethod = preferredMethod;
  }
  const existingId = activeManualOrderId || readPersistedManualOrderId();
  if (existingId) {
    showWaitStep();
    if (!manualOrderPoll) void startManualOrderPolling(existingId);
    setManualOrderUi(existingId, "ממתין לאישור התשלום...");
    return { ok: true, order_id: existingId };
  }
  setFeedback("", false);
  setManualOrderUi("…", "ממתין לאישור התשלום...");
  showWaitStep();
  const created = await createManualOrderSession({
    pack: "basic",
    contact,
    paymentMethod: selectedPayMethod === "paybox" ? "paybox" : "bit",
    customerName: readCustomerName(),
    amountIls: CHECKOUT.amountIls,
  });
  if (!created.ok || !created.order_id) {
    const raw = created.error || "לא הצלחנו לפתוח הזמנה.";
    const message = /kv|redis|אחסון|database/i.test(raw)
      ? "לא הצלחנו לפתוח הזמנה. נסו שוב."
      : raw;
    setFeedback(message, false);
    setManualOrderUi("", message);
    showPayStep();
    return null;
  }
  void startManualOrderPolling(created.order_id);
  return created;
}

function setPayMethod(method) {
  selectedPayMethod = method === "paybox" ? "paybox" : "bit";
}

function setHostedPayStatus(_text) {
  /* unused in MVP */
}

function applyPaidUnlock(token, message) {
  window.QCRateLimit?.reset();
  if (token) unlockWithPaymentToken(token);
  else unlock();
  setPaidUi(true);
  setFeedback(message, true);
  showDownloadStep();
  void runHighResExport();
}

function prefersSameTabCheckout() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
}

const PAY_FALLBACK_TOAST = "המספר הועתק! שנה לאפליקציית התשלום";
let payToastTimer = 0;

function showPayFallbackToast(message = PAY_FALLBACK_TOAST) {
  let el = document.getElementById("qc-pay-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "qc-pay-toast";
    el.className = "qc-pay-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  window.clearTimeout(payToastTimer);
  payToastTimer = window.setTimeout(() => {
    el?.classList.remove("is-visible");
  }, 3200);
}

function copyPayPhoneFallback() {
  const phone = CHECKOUT.bitPhoneCopy;
  const done = () => {
    flashCopyButton();
    showPayFallbackToast();
  };
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(phone).then(done, done);
    return;
  }
  done();
}

function openDeepLink(url) {
  if (!url) return;
  // https only — same-tab on mobile so Bit/PayBox can hand off from the web bridge.
  if (prefersSameTabCheckout()) {
    window.location.href = url;
    return;
  }
  window.open(url, "_blank", "noopener");
}

function dismissCheckout(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  stopManualOrderPoll();
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

async function ensureManualOrderForCheckout(method) {
  if (activeManualOrderId && manualOrderPoll) return activeManualOrderId;
  const created = await proceedToPayment(method);
  return created?.order_id || null;
}

function bindDeepLinkAnchor(id, url) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAnchorElement) || !url) return;
  el.href = url;
  el.rel = "noopener";
  if (prefersSameTabCheckout()) {
    el.removeAttribute("target");
  } else {
    el.target = "_blank";
  }
}

function openBitApp(e) {
  e?.preventDefault?.();
  // Copy while the user gesture is fresh (before await); toast guides manual paste fallback.
  copyPayPhoneFallback();
  void (async () => {
    const orderId = await ensureManualOrderForCheckout("bit");
    if (!orderId) return;
    const url = bitAppOpenUrl(CHECKOUT.amountIls);
    bindDeepLinkAnchor("btn-open-bit", url);
    openDeepLink(url);
  })();
}

function openPayboxApp(e) {
  e?.preventDefault?.();
  copyPayPhoneFallback();
  void (async () => {
    const orderId = await ensureManualOrderForCheckout("paybox");
    if (!orderId) return;
    const url = payboxAppOpenUrl(CHECKOUT.amountIls);
    bindDeepLinkAnchor("btn-open-paybox", url);
    openDeepLink(url);
  })();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(blob);
  });
}

function intlPhoneDigits(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = `972${digits.slice(1)}`;
  return digits;
}

async function sharePdfFile(blob, filename) {
  const file = new File([blob], filename, { type: "application/pdf" });
  const payload = { files: [file], title: filename, text: "קורות החיים מ-QuickCV" };
  if (navigator.canShare && navigator.canShare(payload)) {
    await navigator.share(payload);
    return true;
  }
  return false;
}

async function sendPdfToWhatsApp(e) {
  e?.preventDefault?.();
  if (!isUnlocked()) {
    openCheckoutModal();
    return;
  }
  const status = document.getElementById("download-status");
  const phoneEl = document.getElementById("wa-pdf-phone");
  const phone = String(phoneEl && "value" in phoneEl ? phoneEl.value : readCheckoutContact()).trim();
  if (status) status.textContent = "מכין PDF לשליחה...";
  try {
    const result = await exportHighResPdf({ download: false });
    const blob = result?.blob;
    const filename = result?.filename || "cv.pdf";
    if (!blob) throw new Error("empty pdf");

    const token = getPaymentToken();
    const intl = intlPhoneDigits(phone);
    if (token && intl.startsWith("972")) {
      const pdfBase64 = await blobToBase64(blob);
      const res = await fetch("/api/send-pdf-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, phone: intl, filename, pdfBase64 }),
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        if (status) status.textContent = "ה-PDF נשלח לוואטסאפ.";
        return;
      }
    }

    try {
      if (await sharePdfFile(blob, filename)) {
        if (status) status.textContent = "בחרו WhatsApp בשיתוף כדי לשלוח את הקובץ.";
        return;
      }
    } catch {
      /* cancelled */
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.open(
      whatsappPdfShareUrl(intl, "היי, אלה קורות החיים מ-QuickCV. הקובץ ירד למכשיר — צרפו אותו כאן."),
      "_blank",
      "noopener",
    );
    if (status) status.textContent = "הקובץ ירד. צרפו אותו בשיחת WhatsApp שנפתחה.";
  } catch {
    if (status) status.textContent = "לא הצלחנו לשלוח. נסו הורדה רגילה.";
  }
}

function randomRefCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getOrCreateReferralCode() {
  try {
    let code = localStorage.getItem(REF_CODE_KEY);
    if (!code) {
      code = randomRefCode();
      localStorage.setItem(REF_CODE_KEY, code);
    }
    return code;
  } catch {
    return randomRefCode();
  }
}

function referralUrl() {
  const url = new URL(`${location.origin}/`);
  url.searchParams.set("ref", getOrCreateReferralCode());
  return url.toString();
}

function captureReferralFromUrl() {
  try {
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref && /^[a-zA-Z0-9_-]{3,32}$/.test(ref)) sessionStorage.setItem(REF_FROM_KEY, ref);
  } catch {
    /* ignore */
  }
}

function fillReferralUi() {
  const link = referralUrl();
  const input = document.getElementById("referral-link");
  if (input instanceof HTMLInputElement) input.value = link;
  const wa = document.getElementById("btn-referral-whatsapp");
  if (wa instanceof HTMLAnchorElement) {
    wa.href = whatsappReferralUrl(link);
    wa.target = "_blank";
    wa.rel = "noopener";
  }
}

async function copyReferralLink(e) {
  e?.preventDefault?.();
  const link = referralUrl();
  const btn = document.getElementById("btn-copy-referral");
  try {
    await navigator.clipboard.writeText(link);
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "הועתק";
      setTimeout(() => {
        btn.textContent = prev || "העתק קישור";
      }, 1600);
    }
  } catch {
    const input = document.getElementById("referral-link");
    if (input instanceof HTMLInputElement) {
      input.focus();
      input.select();
    }
  }
}

function downloadCoverLetter(e) {
  e?.preventDefault?.();
  if (!isUnlocked() || selectedPack !== "complete") return;
  window.QCCoverLetter?.download?.();
  const status = document.getElementById("download-status");
  if (status) status.textContent = "המכתב המקדים ירד.";
}

function onOrderBumpChange() {
  setSelectedPack("basic");
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

function readCheckoutContact() {
  const el = document.getElementById("checkout-contact");
  return String(el && "value" in el ? el.value : "").trim();
}

function triggerPDFDownload() {
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
  stopManualOrderPoll();
  setPayMethod("bit");
  setFeedback("", false);
  selectedPack = "basic";
  applyPackUi();

  const existing = readPersistedManualOrderId();
  if (existing && !isUnlocked()) {
    void startManualOrderPolling(existing);
  } else {
    persistManualOrderId("");
    showPayStep();
    const orderIdEl = document.getElementById("manual-order-id");
    if (orderIdEl) orderIdEl.textContent = "—";
    const orderStatusEl = document.getElementById("manual-order-status");
    if (orderStatusEl) orderStatusEl.textContent = "ממתין לאישור התשלום...";
    document.getElementById("manual-order-panel")?.classList.add("hidden");
  }
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

function downloadFormat(kind) {
  if (!isUnlocked()) {
    openCheckoutModal();
    setFeedback("יש לאמת תשלום או קוד לפני ההורדה.", false);
    return;
  }
  if (kind === "pdf") {
    void runHighResExport();
    return;
  }
  if (kind === "cover") {
    downloadCoverLetter();
    return;
  }
  const run = window.QCExport?.[kind];
  const status = document.getElementById("download-status");
  if (!run) return;
  if (status) status.textContent = "מכין קובץ...";
  Promise.resolve(run()).then(
    () => {
      if (status) status.textContent = "ההורדה התחילה.";
    },
    () => {
      if (status) status.textContent = "ההורדה נכשלה. נסו שוב.";
    },
  );
}

function applyPackUi() {
  const amount = CHECKOUT.amountIls;
  const display = displayAmountValue(amount);
  document.querySelectorAll("[data-pay-amount]").forEach((el) => {
    el.textContent = display;
  });
  bindDeepLinkAnchor("btn-open-bit", bitAppOpenUrl(amount));
  bindDeepLinkAnchor("btn-open-paybox", payboxAppOpenUrl(amount));
  const saveEl = document.getElementById("pay-save-badge");
  if (saveEl) saveEl.textContent = "מחיר השקה — 10 ₪ בלבד";
  const nameEl = document.getElementById("mvp-pack-name");
  if (nameEl) nameEl.textContent = CHECKOUT.packageName;
}

function fillCheckoutUi() {
  selectedPack = "basic";
  const bitEl = document.getElementById("bit-number");
  if (bitEl) bitEl.textContent = CHECKOUT.bitPhoneDisplay;
  const launch = displayAmountValue(CHECKOUT.amountIls);
  document.querySelectorAll("[data-price]").forEach((el) => {
    el.textContent = launch;
  });
  document.querySelectorAll("[data-compare-price]").forEach((el) => {
    el.textContent = displayCompareValue();
  });
  document.querySelectorAll("[data-pack-complete-price]").forEach((el) => {
    el.textContent = launch;
  });
  applyPackUi();
}

function onPackChange(e) {
  const input = e?.target;
  if (!(input instanceof HTMLInputElement) || !isPackId(input.value)) return;
  setSelectedPack(input.value);
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
  for (let i = 0; i < 16; i++) {
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
  captureReferralFromUrl();
  fillCheckoutUi();
  fillReferralUi();
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
  document.getElementById("btn-proceed-payment")?.addEventListener("click", () => {
    void proceedToPayment();
  });
  resumePendingManualOrderIfNeeded();
  document.getElementById("btn-open-bit")?.addEventListener("click", openBitApp);
  document.getElementById("btn-copy-bit")?.addEventListener("click", copyBitPhone);
  document.getElementById("btn-open-paybox")?.addEventListener("click", openPayboxApp);
  document.getElementById("btn-send-pdf-whatsapp")?.addEventListener("click", sendPdfToWhatsApp);
  document.getElementById("cover-letter-download")?.addEventListener("click", downloadCoverLetter);
  document.getElementById("btn-copy-referral")?.addEventListener("click", copyReferralLink);

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

function bootTemplates() {
  try {
    initTemplateSelector();
  } catch (err) {
    console.error("template selector init failed", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bootTemplates();
    bind();
  });
} else {
  bootTemplates();
  bind();
}
