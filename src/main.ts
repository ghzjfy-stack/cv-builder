// @ts-nocheck
import { clearPersistedUnlock, getPaymentToken, isUnlocked, unlock, unlockWithPaymentToken, WRONG_CODE_MSG } from "./access/gate.js";
import {
  CHECKOUT,
  REF_CODE_KEY,
  REF_FROM_KEY,
  bitAppOpenUrl,
  bitPayUrl,
  displayAmountValue,
  displayCompareValue,
  isPackId,
  packAmount,
  whatsappPdfShareUrl,
  whatsappReferralUrl,
  whatsappUrl,
  type PackId,
} from "./config/checkout.js";
import { exportHighResPdf } from "./pdf/exportHighRes.js";
import { CODE_FAIL_MSG, verifyDownloadCode } from "./payment/verifyCode.js";
import { createPayboxSession, waitForPayboxPayment, type PayboxMethod } from "./payment/paybox.js";
import { VERIFY_FAIL_MSG, verifyPaymentScreenshot } from "./payment/verifyScreenshot.js";

const modal = () => document.getElementById("payment-modal");
const feedback = () => document.getElementById("code-feedback");
const codeInput = () => document.getElementById("download-code");
const preview = () => document.getElementById("cv-preview-wrapper");
const PACK_KEY = "quickcv.checkoutPack";

let lastFocus = null;
let selectedPack: PackId = "basic";
let selectedPayMethod = "bit";
let payboxPoll = null;
let payboxSessionCache = { key: "", sessionId: "", payUrl: "" };

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
  selectedPack = packId === "complete" ? "complete" : "basic";
  if (persist) {
    try {
      sessionStorage.setItem(PACK_KEY, selectedPack);
    } catch {
      /* ignore */
    }
  }
  applyPackUi();
  payboxSessionCache = { key: "", sessionId: "", payUrl: "" };
  if (selectedPayMethod === "paybox") void prefetchHostedPay("paybox");
}

function setScreenshotFeedback(text, ok) {
  const el = document.getElementById("screenshot-feedback");
  if (!el) return;
  el.textContent = text;
  el.className = `text-sm min-h-5 text-center font-semibold ${ok ? "text-emerald-300" : "text-rose-400"}`;
}

function setVerifyOverlay(on, title, sub) {
  const el = document.getElementById("payment-verify-overlay");
  if (!el) return;
  el.classList.toggle("hidden", !on);
  el.classList.toggle("flex", on);
  const titleEl = document.getElementById("verify-overlay-title");
  const subEl = document.getElementById("verify-overlay-sub");
  if (titleEl && title) titleEl.textContent = title;
  if (subEl && sub) subEl.textContent = sub;
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
  setVerifyOverlay(true, "מאמת את צילום המסך...", "זה לוקח כמה שניות");
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

function stopPayboxPoll() {
  if (payboxPoll) {
    payboxPoll.abort();
    payboxPoll = null;
  }
}

function setPayMethod(method) {
  selectedPayMethod = method === "paybox" ? "paybox" : "bit";
  document.querySelectorAll("[data-pay-method]").forEach((btn) => {
    const on = btn.getAttribute("data-pay-method") === selectedPayMethod;
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.getElementById("pay-panel-bit")?.classList.toggle("hidden", selectedPayMethod !== "bit");
  document.getElementById("pay-panel-paybox")?.classList.toggle("hidden", selectedPayMethod !== "paybox");
  if (selectedPayMethod === "paybox") void prefetchHostedPay("paybox");
}

function setHostedPayStatus(text) {
  const paybox = document.getElementById("paybox-poll-status");
  if (paybox) paybox.textContent = selectedPayMethod === "paybox" ? text : "";
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

function isReadyPayUrl(url) {
  const href = String(url || "").trim();
  if (!href || href === "#" || href.endsWith("#")) return false;
  try {
    const parsed = new URL(href, window.location.href);
    if (parsed.origin === window.location.origin && (parsed.pathname === "/" || parsed.pathname === window.location.pathname)) {
      return false;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function ensureHostedSession(method: PayboxMethod) {
  const payMethod = "paybox";
  const key = `${payMethod}:${selectedPack}:${readCheckoutContact()}`;
  if (payboxSessionCache.key === key && payboxSessionCache.sessionId && payboxSessionCache.payUrl) {
    return payboxSessionCache;
  }
  const created = await createPayboxSession({
    pack: selectedPack,
    contact: readCheckoutContact(),
    method: payMethod,
  });
  if (!created.ok || !created.session_id) {
    throw new Error(created.error || "session_failed");
  }
  payboxSessionCache = {
    key,
    sessionId: created.session_id,
    payUrl: created.pay_url || CHECKOUT.payboxPayUrl,
  };
  return payboxSessionCache;
}

function bindHostedPayLink(id, url) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAnchorElement) || !url) return;
  el.href = url;
  el.target = prefersSameTabCheckout() ? "_self" : "paybox_checkout";
  el.rel = "noopener noreferrer";
}

function openCheckoutUrl(url, popup) {
  if (!url) return;
  if (prefersSameTabCheckout()) {
    window.location.assign(url);
    return;
  }
  if (popup && !popup.closed) {
    popup.location.replace(url);
    return;
  }
  const opened = window.open(url, "paybox_checkout");
  if (!opened) window.location.assign(url);
}

async function prefetchHostedPay(method: PayboxMethod) {
  try {
    const session = await ensureHostedSession(method);
    bindHostedPayLink("btn-open-paybox", session.payUrl);
  } catch {
    /* click handler retries */
  }
}

async function startHostedPayment(method: PayboxMethod) {
  stopPayboxPoll();
  setHostedPayStatus("ממתינים לאישור PayBox...");
  try {
    const session = await ensureHostedSession(method);
    bindHostedPayLink("btn-open-paybox", session.payUrl);
    setVerifyOverlay(
      true,
      "ממתינים לאישור PayBox...",
      "אפשר לחזור לכאן אחרי התשלום — נזהה אותו אוטומטית",
    );
    payboxPoll = new AbortController();
    const result = await waitForPayboxPayment(session.sessionId, { signal: payboxPoll.signal });
    if (result.paid === true && result.token) {
      window.QCLog?.add("auth_ok", "paybox webhook");
      applyPaidUnlock(result.token, "התשלום אומת. מוריד את ה-PDF...");
      return;
    }
    if (result.error && result.error !== "cancelled") {
      setHostedPayStatus(result.error);
      setFeedback(result.error, false);
    }
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : "לא הצלחנו לפתוח את PayBox.";
    setHostedPayStatus(message);
    setFeedback(message, false);
  } finally {
    setVerifyOverlay(false);
    payboxPoll = null;
  }
}

async function onHostedPayClick(e, method: PayboxMethod) {
  const el = e?.currentTarget;
  const sameTab = prefersSameTabCheckout();
  const readyHref = el instanceof HTMLAnchorElement ? el.href : "";
  const cachedReady =
    payboxSessionCache.payUrl &&
    payboxSessionCache.key.startsWith("paybox:") &&
    isReadyPayUrl(payboxSessionCache.payUrl);

  if (sameTab && cachedReady && isReadyPayUrl(readyHref)) {
    bindHostedPayLink("btn-open-paybox", payboxSessionCache.payUrl);
    void startHostedPayment(method);
    return;
  }

  e?.preventDefault?.();
  const popup = sameTab ? null : window.open("about:blank", "paybox_checkout");
  setHostedPayStatus("פותחים את PayBox...");
  try {
    const session = await ensureHostedSession(method);
    bindHostedPayLink("btn-open-paybox", session.payUrl);
    if (session.payUrl) openCheckoutUrl(session.payUrl, popup);
    else {
      try {
        popup?.close();
      } catch {
        /* ignore */
      }
      throw new Error("לא קיבלנו קישור תשלום מ-PayBox.");
    }
    void startHostedPayment(method);
  } catch (err) {
    try {
      popup?.close();
    } catch {
      /* ignore */
    }
    const message = err instanceof Error && err.message ? err.message : "לא הצלחנו לפתוח את PayBox.";
    setHostedPayStatus(message);
    setFeedback(message, false);
  }
}

function dismissCheckout(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  stopPayboxPoll();
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
  const url = bitAppOpenUrl(selectedAmount());
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
  window.open(whatsappUrl(selectedAmount()), "_blank", "noopener");
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
  const el = document.getElementById("order-bump");
  setSelectedPack(el instanceof HTMLInputElement && el.checked ? "complete" : "basic");
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
  return String(primary && "value" in primary ? primary.value : "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function readCheckoutContact() {
  const el = document.getElementById("checkout-contact");
  return String(el && "value" in el ? el.value : "").trim();
}

function triggerPDFDownload() {
  if (!isUnlocked()) {
    void verifyAndUnlock();
    return;
  }

  setPaidUi(true);
  closeModal();
  void runHighResExport();
}

function openCheckoutModal() {
  openModal();
  showPayStep();
  stopPayboxPoll();
  setPayMethod("bit");
  setVerifyOverlay(false);
  setScreenshotFeedback("", false);
  setHostedPayStatus("");
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

async function verifyAndUnlock(e) {
  e?.preventDefault?.();
  if (isUnlocked()) {
    triggerPDFDownload();
    return;
  }

  const limit = window.QCRateLimit?.status?.();
  if (limit?.locked) {
    setFeedback(WRONG_CODE_MSG, false);
    return;
  }

  const userCode = readAccessCode();
  if (userCode.length !== 6) {
    setFeedback("נא להזין קוד בן 6 תווים מההודעה שקיבלתם.", false);
    return;
  }

  const btn = document.getElementById("verify-btn");
  btn?.setAttribute("disabled", "true");
  setFeedback("מאמת את הקוד...", true);
  try {
    const result = await verifyDownloadCode(userCode, readCheckoutContact());
    if (result && result.ok === true && result.download?.authorized !== false) {
      window.QCRateLimit?.reset();
      window.QCLog?.add("auth_ok", "code verified");
      if (result.token) unlockWithPaymentToken(result.token);
      else unlock();
      setPaidUi(true);
      setFeedback("הקוד אומת. מוריד את ה-PDF...", true);
      showDownloadStep();
      void runHighResExport();
      return;
    }
    window.QCLog?.add("auth_fail", "bad code");
    window.QCRateLimit?.fail();
    setFeedback(result?.error || CODE_FAIL_MSG, false);
  } catch {
    setFeedback(CODE_FAIL_MSG, false);
  } finally {
    btn?.removeAttribute("disabled");
  }
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
  const amount = selectedAmount();
  const display = displayAmountValue(amount);
  document.querySelectorAll("[data-pay-amount]").forEach((el) => {
    el.textContent = display;
  });
  document.querySelectorAll('input[name="checkout-pack"]').forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const on = input.value === selectedPack;
    input.checked = on;
    input.closest(".pay-pack")?.classList.toggle("is-selected", on);
  });
  const openBit = document.getElementById("btn-open-bit");
  if (openBit instanceof HTMLAnchorElement) {
    openBit.href = bitAppOpenUrl(amount);
    openBit.target = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "_self" : "_blank";
    openBit.rel = "noopener";
  }
  const qr = document.getElementById("bit-qr");
  if (qr instanceof HTMLImageElement) {
    qr.src = bitPayUrl(amount);
    qr.alt = `קוד QR לתשלום ${display} ₪ ב-Bit`;
  }
  const saveEl = document.getElementById("pay-save-badge");
  if (saveEl) {
    const saved = Math.round(CHECKOUT.compareAtIls - amount);
    saveEl.textContent =
    selectedPack === "complete" ? "חבילה מלאה במחיר השקה" : `מחיר השקה — חיסכון של ${saved} ₪`;
  }
  const bump = document.getElementById("order-bump");
  if (bump instanceof HTMLInputElement) bump.checked = selectedPack === "complete";
}

function fillCheckoutUi() {
  selectedPack = readStoredPack();
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
    el.textContent = displayAmountValue(CHECKOUT.packCompleteIls);
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
  document.getElementById("btn-open-bit")?.addEventListener("click", openBitApp);
  document.getElementById("btn-copy-bit")?.addEventListener("click", copyBitPhone);
  document.getElementById("btn-open-paybox")?.addEventListener("click", (e) => {
    void onHostedPayClick(e, "paybox");
  });
  document.querySelectorAll("[data-pay-method]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const method = btn.getAttribute("data-pay-method") || "bit";
      stopPayboxPoll();
      setVerifyOverlay(false);
      setPayMethod(method);
    });
  });
  document.getElementById("btn-whatsapp")?.addEventListener("click", openWhatsApp);
  document.getElementById("btn-send-pdf-whatsapp")?.addEventListener("click", sendPdfToWhatsApp);
  document.getElementById("order-bump")?.addEventListener("change", onOrderBumpChange);
  document.getElementById("cover-letter-download")?.addEventListener("click", downloadCoverLetter);
  document.getElementById("btn-copy-referral")?.addEventListener("click", copyReferralLink);
  document.getElementById("verify-btn")?.addEventListener("click", verifyAndUnlock);
  document.getElementById("payment-screenshot")?.addEventListener("change", onPaymentScreenshotChange);
  document.querySelectorAll('input[name="checkout-pack"]').forEach((input) => {
    input.addEventListener("change", onPackChange);
  });

  codeInput()?.addEventListener("input", (e) => {
    const el = e.currentTarget;
    if (!(el instanceof HTMLInputElement)) return;
    el.value = el.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  });
  codeInput()?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void verifyAndUnlock(e);
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
