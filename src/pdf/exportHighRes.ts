// @ts-nocheck
/**
 * WYSIWYG high-res PDF: captures the live #cv-target (all layouts/templates)
 * via html2canvas → jsPDF, then downloads reliably on desktop + mobile.
 */
import { isUnlocked } from "../access/gate.js";

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const A4_CSS_PX = 794;
const A4_CSS_H = Math.round((A4_CSS_PX * PAGE_H_MM) / PAGE_W_MM);
const MAX_CANVAS = 8192;

function getJsPdfCtor() {
  return window.jspdf?.jsPDF || window.jsPDF;
}

function cvCaptureDir() {
  const source = document.getElementById("cv-target");
  return source?.getAttribute("dir") === "ltr" || window.QCCvLang === "en" ? "ltr" : "rtl";
}

function fileBase() {
  const raw = document.getElementById("in-name")?.value || "Resume";
  // ASCII-only filenames: Hebrew names break iOS/WhatsApp file share and fall back to page links.
  const safe =
    window.QCSanitize?.filename?.(raw) ||
    String(raw)
      .normalize("NFKD")
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40);
  return "QuickCV_" + (safe || "Resume");
}

function shareSafeFilename(name) {
  const base = String(name || "QuickCV_Resume.pdf").replace(/\.pdf$/i, "");
  const ascii = base.replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return (ascii || "QuickCV_Resume") + ".pdf";
}

function cvThemeSource() {
  if (typeof window.QCCvThemeRoot === "function") {
    const root = window.QCCvThemeRoot();
    if (root) return root;
  }
  return (
    document.getElementById("cv-preview-wrapper") ||
    document.getElementById("cv-preview-stack") ||
    document.documentElement
  );
}

function copyCssVars(fromEl, toEl) {
  const accentSrc = fromEl && fromEl !== document.documentElement ? fromEl : cvThemeSource();
  const fontSrc = document.documentElement;
  const preview = document.getElementById("cv-target") || cvThemeSource();
  const copyNamed = (src, names) => {
    if (!src) return;
    const cs = getComputedStyle(src);
    names.forEach((name) => {
      const v = (src.style.getPropertyValue(name) || cs.getPropertyValue(name) || "").trim();
      if (v) toEl.style.setProperty(name, v);
    });
  };
  copyNamed(accentSrc, ["--accent", "--cv-accent-color"]);
  copyNamed(fontSrc, ["--cv-font", "--cv-scale", "--cv-leading", "--cv-density"]);
  // Match live page-fit spacing so PDF matches on-screen preview.
  copyNamed(preview, ["--space-fit", "--section-gap", "--item-padding"]);
  const accent = (
    toEl.style.getPropertyValue("--accent") ||
    toEl.style.getPropertyValue("--cv-accent-color") ||
    ""
  ).trim();
  if (accent) {
    toEl.style.setProperty("--accent", accent);
    toEl.style.setProperty("--cv-accent-color", accent);
  }
  // Never inherit a compressed fit-scale from the studio chrome.
  toEl.style.setProperty("--cv-fit-scale", "1");
  const stack = (
    fontSrc.style.getPropertyValue("--cv-font") ||
    getComputedStyle(fontSrc).getPropertyValue("--cv-font") ||
    ""
  ).trim();
  if (stack) toEl.style.fontFamily = stack;
}

function selectedCvFontName() {
  const raw =
    document.documentElement.style.getPropertyValue("--cv-font") ||
    getComputedStyle(document.documentElement).getPropertyValue("--cv-font") ||
    "";
  return raw.replace(/['"]/g, "").split(",")[0].trim() || "Rubik";
}

async function waitForCvFonts() {
  const name = selectedCvFontName();
  const loads = [];
  if (document.fonts?.load) {
    ["400", "700"].forEach((weight) => {
      loads.push(document.fonts.load(`${weight} 16px "${name}"`));
    });
  }
  if (document.fonts?.ready) loads.push(document.fonts.ready);
  if (loads.length) {
    try {
      await Promise.race([
        Promise.all(loads),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch {
      /* fallback glyphs are fine */
    }
  }
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label || "timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function setSpinner(on) {
  const busy = !!on;
  window.__qcPdfBusy = busy;
  window.__qcPdfBusyAt = busy ? Date.now() : 0;
  document.documentElement.classList.toggle("qc-pdf-busy", busy);

  const el = document.getElementById("pdf-spinner");
  if (el) {
    el.classList.toggle("hidden", !busy);
    el.classList.toggle("flex", busy);
  }
  const lead = document.getElementById("pdf-spin-lead");
  if (lead && busy) {
    const mobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent || "");
    lead.textContent = mobile
      ? window.QCCvLang === "en"
        ? "Preparing your PDF — keep this screen open"
        : "מכין את ה-PDF — השאירו את המסך פתוח"
      : window.QCCvLang === "en"
        ? "Your file will download in a moment"
        : "הקובץ יורד למחשב בעוד רגע";
  }

  const label =
    window.QCCvLang === "en" ? "Preparing PDF…" : "מכין PDF…";
  const btnIds = ["btn-download-cv-pdf", "btn-download-pdf", "btn-download-pdf-mobile", "btn-sample-pdf-download"];
  btnIds.forEach((id) => {
    const btn = document.getElementById(id);
    if (!(btn instanceof HTMLElement)) return;
    btn.toggleAttribute("disabled", busy);
    btn.setAttribute("aria-busy", busy ? "true" : "false");
    btn.classList.toggle("is-pdf-loading", busy);
    if (busy) {
      if (!btn.dataset.pdfLabel) btn.dataset.pdfLabel = btn.innerHTML;
      btn.innerHTML =
        '<span class="qc-btn-spinner" aria-hidden="true"></span><span>' + label + "</span>";
    } else if (btn.dataset.pdfLabel != null) {
      btn.innerHTML = btn.dataset.pdfLabel;
      delete btn.dataset.pdfLabel;
    }
  });
}

function flattenUnsupportedColors(root, view) {
  const win = view || window;
  const nodes = root.querySelectorAll("*");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!(node instanceof HTMLElement)) continue;
    const cs = win.getComputedStyle(node);
    // Strip filters only — full color flatten on every node is too slow for large CVs.
    if (cs.filter && cs.filter !== "none") node.style.filter = "none";
    if (cs.backdropFilter && cs.backdropFilter !== "none") node.style.backdropFilter = "none";
  }
}

function prepareCaptureRoot(root, view) {
  const win = view || window;
  const nodes = [root, ...root.querySelectorAll("*")];
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    // Keep photo crop + circular masks intact for html2canvas.
    const keepClip =
      node.classList.contains("cv-photo") ||
      node.classList.contains("cv-photo-block") ||
      node.id === "out-photo" ||
      node.id === "out-photo-fallback" ||
      Boolean(node.closest?.(".cv-photo"));
    // Premium rail must keep overflow clipping so footer pad is not painted off-sheet.
    const premiumRail =
      node.classList.contains("cv-sidebar") ||
      node.classList.contains("cv-sidebar-inner") ||
      node.classList.contains("cv-sidebar-rail-pad") ||
      Boolean(node.closest?.(".layout-premium > .cv-sidebar"));
    if (keepClip || (premiumRail && node.closest?.(".layout-premium"))) {
      if (keepClip || node.classList.contains("cv-sidebar") || node.classList.contains("cv-sidebar-inner")) {
        node.style.overflow = "hidden";
      }
      if (keepClip) node.style.maxHeight = "";
    } else {
      node.style.overflow = "visible";
      node.style.overflowX = "visible";
      node.style.overflowY = "visible";
      node.style.maxHeight = "none";
    }
    node.style.textOverflow = "clip";
    node.style.boxShadow = "none";
    node.style.transform = "none";
  });
  flattenUnsupportedColors(root, win);
}

/** Keep Executive Split sidebar footer text clear of the A4 edge during capture. */
function ensurePremiumSidebarFooter(sheet: HTMLElement) {
  if (!sheet.classList.contains("layout-premium")) return;
  const sidebar = sheet.querySelector(".cv-sidebar");
  if (!(sidebar instanceof HTMLElement)) return;

  sidebar.style.setProperty("display", "flex", "important");
  sidebar.style.setProperty("flex-direction", "column", "important");
  sidebar.style.setProperty("height", "100%", "important");
  sidebar.style.setProperty("min-height", "100%", "important");
  sidebar.style.setProperty("max-height", "100%", "important");
  sidebar.style.setProperty("padding-bottom", "2rem", "important");
  sidebar.style.setProperty("box-sizing", "border-box", "important");
  sidebar.style.setProperty("overflow", "hidden", "important");
  sidebar.style.setProperty("background", "#454545", "important");

  const inner = sidebar.querySelector(".cv-sidebar-inner");
  if (inner instanceof HTMLElement) {
    // MUST stay auto/flex — height:100% eats the rail pad and clips recommendations.
    inner.style.setProperty("flex", "1 1 0", "important");
    inner.style.setProperty("height", "auto", "important");
    inner.style.setProperty("min-height", "0", "important");
    inner.style.setProperty("max-height", "none", "important");
    inner.style.setProperty("overflow", "hidden", "important");
    inner.style.setProperty("padding-top", "0.55rem", "important");
    inner.style.setProperty("padding-left", "0.75rem", "important");
    inner.style.setProperty("padding-right", "0.75rem", "important");
    inner.style.setProperty("padding-bottom", "2.25rem", "important");
    inner.style.setProperty("box-sizing", "border-box", "important");
    inner.style.setProperty("background", "#454545", "important");
  }

  let railPad = sidebar.querySelector(".cv-sidebar-rail-pad");
  if (!(railPad instanceof HTMLElement)) {
    railPad = (sheet.ownerDocument || document).createElement("div");
    railPad.className = "cv-sidebar-rail-pad";
    railPad.setAttribute("aria-hidden", "true");
    sidebar.appendChild(railPad);
  }
  railPad.style.setProperty("display", "block", "important");
  railPad.style.setProperty("flex", "0 0 5rem", "important");
  railPad.style.setProperty("flex-grow", "0", "important");
  railPad.style.setProperty("flex-shrink", "0", "important");
  railPad.style.setProperty("width", "100%", "important");
  railPad.style.setProperty("height", "5rem", "important");
  railPad.style.setProperty("min-height", "5rem", "important");
  railPad.style.setProperty("max-height", "5rem", "important");
  railPad.style.setProperty("margin", "0", "important");
  railPad.style.setProperty("padding", "0", "important");
  railPad.style.setProperty("background", "#454545", "important");
  railPad.style.setProperty("order", "999", "important");
  railPad.style.setProperty("pointer-events", "none", "important");

  const refs = sidebar.querySelector("#sec-references");
  if (refs instanceof HTMLElement) {
    refs.style.setProperty("margin-bottom", "0.75rem", "important");
    refs.style.setProperty("padding-bottom", "0.25rem", "important");
    refs.style.setProperty("flex-shrink", "0", "important");
  }
}

function isSidebarLayout(el) {
  return (
    el.classList.contains("layout-sidebar") ||
    el.classList.contains("layout-split") ||
    el.classList.contains("layout-charcoal") ||
    el.classList.contains("layout-navy") ||
    el.classList.contains("layout-azure") ||
    el.classList.contains("layout-premium") ||
    el.classList.contains("layout-cobalt")
  );
}

function isFullBleedLayout(el) {
  return (
    el.classList.contains("layout-charcoal") ||
    el.classList.contains("layout-navy") ||
    el.classList.contains("layout-azure") ||
    el.classList.contains("layout-premium") ||
    el.classList.contains("layout-cobalt")
  );
}

/** Lock sheet to full A4 (or taller) so 1fr sidebar columns paint to the bottom. */
function lockCaptureSheetHeight(host) {
  const sheet = host?.querySelector?.(".cv-print-sheet");
  if (!(sheet instanceof HTMLElement)) return;
  const sidebarish = isSidebarLayout(sheet) || isFullBleedLayout(sheet);
  const premium = sheet.classList.contains("layout-premium");
  const classic = sheet.classList.contains("layout-classic");

  // Measure natural content height first (overflow hidden would clip the measure).
  sheet.style.height = "auto";
  sheet.style.minHeight = "0px";
  sheet.style.maxHeight = "none";
  sheet.style.overflow = "visible";
  void sheet.offsetHeight;
  const contentH = Math.max(
    1,
    Math.ceil(sheet.scrollHeight || 0),
    Math.ceil(sheet.offsetHeight || 0),
  );

  // Executive Split is always a single A4 sheet. Classic must not clip with slack —
  // tiny overflow used to chop recommendations at the page edge.
  // Other sidebar layouts get a small slack so measurement noise does not spawn a blank stub page 2.
  const slack = premium ? 220 : classic ? 0 : 12;
  const fitsOne = premium || classic || contentH <= A4_CSS_H + slack;
  const needed = fitsOne ? A4_CSS_H : contentH;

  sheet.style.minHeight = `${needed}px`;
  sheet.style.height = `${needed}px`;
  sheet.style.maxHeight = fitsOne ? `${needed}px` : "none";
  sheet.style.overflow = "hidden";
  host.style.minHeight = `${needed}px`;
  host.style.height = fitsOne ? `${needed}px` : "auto";
  host.style.maxHeight = fitsOne ? `${needed}px` : "none";
  host.style.overflow = fitsOne ? "hidden" : "visible";

  if (sidebarish) {
    sheet.querySelectorAll(".cv-sidebar, .cv-sidebar-inner, .cv-main, .cv-columns, .cv-photo-block, #cv-header").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.classList.contains("cv-photo") || el.closest?.(".cv-photo")) return;
      el.style.alignSelf = "stretch";
    });
    sheet.querySelectorAll(".cv-sidebar").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.height = "100%";
      el.style.minHeight = "100%";
      el.style.maxHeight = "100%";
      el.style.overflow = "hidden";
    });
    // Non-premium: stretch inner to fill. Premium must keep flex+auto so rail-pad survives.
    if (!premium) {
      sheet.querySelectorAll(".cv-sidebar-inner").forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        el.style.height = "100%";
        el.style.minHeight = "100%";
        el.style.maxHeight = "100%";
        el.style.overflow = "hidden";
      });
    }
  }

  if (premium) {
    sheet.querySelectorAll(".cv-main").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.overflow = "hidden";
      el.style.maxHeight = "100%";
    });
    ensurePremiumSidebarFooter(sheet);
  }
}

/**
 * Express/classic: compress --space-fit (and padding if needed) so the whole CV
 * fits one A4 sheet — prevents recommendations from being clipped at the bottom.
 */
function fitClassicCaptureToOnePage(host) {
  const sheet = host?.querySelector?.(".cv-print-sheet");
  if (!(sheet instanceof HTMLElement)) return;
  if (!sheet.classList.contains("layout-classic")) return;

  const MIN_FIT = 0.56;
  const measure = () => {
    sheet.style.height = "auto";
    sheet.style.minHeight = "0px";
    sheet.style.maxHeight = "none";
    sheet.style.overflow = "visible";
    void sheet.offsetHeight;
    return Math.max(
      1,
      Math.ceil(sheet.scrollHeight || 0),
      Math.ceil(sheet.offsetHeight || 0),
    );
  };

  let fit = parseFloat(sheet.style.getPropertyValue("--space-fit") || "") || 1;
  if (!Number.isFinite(fit) || fit <= 0) fit = 1;
  fit = Math.min(1, Math.max(MIN_FIT, fit));
  sheet.style.setProperty("--space-fit", String(fit));
  host.style.setProperty("--space-fit", String(fit));

  let h = measure();
  if (h <= A4_CSS_H) return;

  // Binary search the largest space-fit that still fits one A4.
  let lo = MIN_FIT;
  let hi = fit;
  let best = MIN_FIT;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    sheet.style.setProperty("--space-fit", String(mid));
    host.style.setProperty("--space-fit", String(mid));
    h = measure();
    if (h <= A4_CSS_H) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  sheet.style.setProperty("--space-fit", String(best));
  host.style.setProperty("--space-fit", String(best));
  h = measure();
  if (h <= A4_CSS_H) return;

  // Still over: tighten classic page padding (design stays the same, just denser).
  const pads = [
    [22, 36, 28],
    [18, 32, 22],
    [14, 28, 18],
  ];
  for (const [pt, px, pb] of pads) {
    sheet.style.padding = `${pt}px ${px}px ${pb}px`;
    h = measure();
    if (h <= A4_CSS_H) return;
  }
}

function ensureCaptureHost() {
  let host = document.getElementById("qc-print-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "qc-print-host";
    host.setAttribute("dir", cvCaptureDir());
    document.body.appendChild(host);
  }
  return host;
}

function stripPreviewChrome(clone) {
  clone.querySelectorAll(".cv-skel, .cv-watermark, .cv-shield, .cv-page-fit, #cv-page-break-line, #cv-page-fit-msg, #cv-page-fit-banner").forEach((el) => el.remove());
  clone.querySelectorAll(".cv-sec-skel").forEach((el) => {
    el.style.display = "none";
  });
  // Paid / clean sheet — no unpaid overlays.
  clone.classList.add("paid");
  clone.querySelectorAll("[hidden]").forEach((el) => {
    if (el.classList.contains("cv-print-keep")) return;
    // Keep structurally relevant empty sections out of the way.
  });
}

/**
 * Navy / Cobalt use display:contents for .cv-columns / .cv-sidebar.
 * html2canvas often skips those promoted grid children — flatten the clone so
 * photo, header, sidebar-inner, and main are direct grid items with painted rails.
 */
function promotePhotoRailForCapture(clone, english, theme = "cobalt") {
  const isNavy = theme === "navy";
  const rail = isNavy ? "#12192b" : "#2c4a7c";
  const photoPad = isNavy ? "1.55rem 1rem 0.35rem" : "1.35rem 1rem 0.35rem";
  const headPad = isNavy ? "0.65rem 1.15rem 1.15rem" : "0.45rem 1.05rem 1rem";
  const sidePad = isNavy ? "0.35rem 1.25rem 1.7rem" : "0.2rem 1.1rem 1.5rem";
  const mainPad = isNavy ? "1.55rem 1.7rem 1.7rem 1.45rem" : "1.4rem 1.5rem 1.5rem 1.35rem";
  const avatarBg = isNavy ? "#8d93a3" : "#9aa8c2";
  const photo = clone.querySelector(".cv-photo-block");
  const sideInner = clone.querySelector(".cv-sidebar-inner");
  const main = clone.querySelector(".cv-main");
  const header = clone.querySelector("#cv-header");
  const columns = clone.querySelector(".cv-columns");
  const sidebar = clone.querySelector(".cv-sidebar");

  // Kill the continuous ::before rail — it stacks above contents in html2canvas.
  clone.classList.add(isNavy ? "qc-navy-capture-flat" : "qc-cobalt-capture-flat");
  if (isNavy) clone.style.setProperty("--navy", rail);
  else clone.style.setProperty("--cobalt", rail);

  [photo, header, sideInner, main].forEach((el) => {
    if (el instanceof HTMLElement) clone.appendChild(el);
  });
  sidebar?.remove();
  columns?.remove();
  clone.querySelectorAll(".cv-col-rule, .cv-sidebar-rail-pad").forEach((el) => el.remove());

  const paint = (el, extra = {}) => {
    if (!(el instanceof HTMLElement)) return;
    Object.assign(el.style, {
      background: rail,
      color: "#ffffff",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
      zIndex: "1",
      ...extra,
    });
  };

  if (photo instanceof HTMLElement) {
    paint(photo, {
      gridArea: "photo",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-end",
      padding: photoPad,
      margin: "0",
      border: "0",
      borderRadius: "0",
      boxShadow: "none",
    });
    const avatar = photo.querySelector(".cv-photo");
    if (avatar instanceof HTMLElement) {
      Object.assign(avatar.style, {
        width: isNavy ? "118px" : "112px",
        height: isNavy ? "118px" : "112px",
        borderRadius: "999px",
        overflow: "hidden",
        border: isNavy ? "3px solid rgba(255, 255, 255, 0.92)" : "4px solid #ffffff",
        background: avatarBg,
        flex: "0 0 auto",
      });
      avatar.querySelectorAll("svg, img").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        Object.assign(node.style, {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        });
      });
    }
  }

  if (header instanceof HTMLElement) {
    paint(header, {
      gridArea: "head",
      textAlign: "center",
      padding: headPad,
      margin: "0",
      border: "0",
      borderRadius: "0",
      boxShadow: "none",
    });
    header.querySelectorAll("#out-name, #out-title, .dynamic-text").forEach((node) => {
      if (node instanceof HTMLElement) node.style.color = "#ffffff";
    });
  }

  if (sideInner instanceof HTMLElement) {
    paint(sideInner, {
      gridArea: "side",
      display: "flex",
      flexDirection: "column",
      gap: isNavy ? "1.15rem" : "0.95rem",
      padding: sidePad,
      margin: "0",
      border: "0",
      borderRadius: "0",
      minHeight: "100%",
      height: "100%",
      alignSelf: "stretch",
      direction: english ? "ltr" : "rtl",
      textAlign: english ? "left" : "right",
      overflow: "hidden",
    });
    sideInner.querySelectorAll(".cv-section-title, .cv-contact-row, .cv-contact-link, .cv-skill-badge, .cv-lang-name, .cv-lang-row, #out-skills, #out-languages").forEach((node) => {
      if (node instanceof HTMLElement) node.style.color = "#ffffff";
    });
    const badges = sideInner.querySelector(".cv-skill-badges");
    if (badges instanceof HTMLElement) {
      Object.assign(badges.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "0.4rem",
        width: "100%",
      });
    }
    sideInner.querySelectorAll(".cv-skill-badge").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      Object.assign(node.style, {
        color: "#ffffff",
        background: "rgba(255,255,255,0.14)",
        border: "1px solid rgba(255,255,255,0.35)",
        flex: "0 0 auto",
        whiteSpace: "nowrap",
      });
    });
    sideInner.querySelectorAll(".cv-lang-row").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      Object.assign(node.style, {
        display: isNavy ? "grid" : "flex",
        gridTemplateColumns: isNavy ? "1fr auto" : undefined,
        flexDirection: isNavy ? undefined : "column",
        alignItems: isNavy ? "center" : undefined,
        gap: isNavy ? "0.45rem" : "0.28rem",
        width: "100%",
        color: "#ffffff",
      });
    });
    sideInner.querySelectorAll(".cv-lang-track").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      Object.assign(node.style, {
        display: isNavy ? "none" : "block",
        width: "100%",
        height: "6px",
        background: "rgba(255,255,255,0.22)",
        borderRadius: "999px",
        overflow: "hidden",
      });
    });
    const contact = sideInner.querySelector(".cv-contact-sidebar");
    if (contact instanceof HTMLElement) {
      Object.assign(contact.style, {
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
        color: "#ffffff",
        width: "100%",
      });
      // Drop emoji prefixes — rail templates already paint SVG contact icons.
      contact.querySelectorAll('[id^="out-"]').forEach((slot) => {
        if (!(slot instanceof HTMLElement)) return;
        const cleaned = String(slot.textContent || "")
          .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s📞✉️📍🔗]+/u, "")
          .trim();
        if (cleaned) slot.textContent = cleaned;
        else {
          slot.textContent = "";
          slot.style.display = "none";
        }
      });
      // Hide empty LinkedIn/website rows (icon-only) in the PDF capture.
      contact.querySelectorAll(".cv-contact-row").forEach((row) => {
        if (!(row instanceof HTMLElement)) return;
        const slot = row.querySelector('[id^="out-"]');
        const empty =
          !slot ||
          (slot instanceof HTMLElement &&
            (slot.style.display === "none" || !String(slot.textContent || "").trim()));
        row.classList.toggle("cv-contact-empty", !!empty);
        row.style.display = empty ? "none" : "";
        if (empty) row.setAttribute("aria-hidden", "true");
      });
    }
  }

  if (main instanceof HTMLElement) {
    Object.assign(main.style, {
      gridArea: "main",
      background: "#ffffff",
      color: isNavy ? "#333333" : "#1f2937",
      direction: english ? "ltr" : "rtl",
      textAlign: english ? "left" : "right",
      padding: mainPad,
      zIndex: "1",
      minWidth: "0",
    });
  }
}

/** @deprecated Use promotePhotoRailForCapture(..., "cobalt") */
function promoteCobaltRailForCapture(clone, english) {
  promotePhotoRailForCapture(clone, english, "cobalt");
}

function prepareCaptureClone(sourceId = "cv-target") {
  const source = document.getElementById(sourceId);
  if (!source) return null;

  if (typeof window.updateCV === "function") window.updateCV();
  try {
    window.QCDraft?.save?.();
  } catch {
    /* ignore */
  }

  const host = ensureCaptureHost();
  const dir = cvCaptureDir();
  host.setAttribute("dir", dir);
  host.replaceChildren();
  copyCssVars(cvThemeSource(), host);
  copyCssVars(source, host);

  const clone = source.cloneNode(true);
  clone.removeAttribute("id");
  clone.classList.add("cv-print-sheet", "paid");
  if (source.classList.contains("cv-lang-en")) clone.classList.add("cv-lang-en");
  if (source.classList.contains("cv-lang-he")) clone.classList.add("cv-lang-he");
  stripPreviewChrome(clone);
  host.appendChild(clone);

  host.classList.add("qc-capturing");
  document.documentElement.classList.add("qc-exporting");
  const fullBleed = isFullBleedLayout(clone);
  Object.assign(host.style, {
    display: "block",
    position: "fixed",
    left: "0",
    top: "0",
    width: A4_CSS_PX + "px",
    minWidth: A4_CSS_PX + "px",
    maxWidth: A4_CSS_PX + "px",
    height: "auto",
    minHeight: A4_CSS_H + "px",
    maxHeight: "none",
    padding: "0",
    margin: "0",
    background: "#ffffff",
    color: "#0f172a",
    zIndex: "2147483645",
    overflow: "visible",
    pointerEvents: "none",
    boxSizing: "border-box",
    transform: "none",
    direction: dir,
  });

  Object.assign(clone.style, {
    width: "100%",
    maxWidth: "100%",
    margin: "0",
    padding: fullBleed ? "0" : isSidebarLayout(clone) ? "0" : "28px 44px 36px",
    minHeight: A4_CSS_H + "px",
    height: A4_CSS_H + "px",
    maxHeight: "none",
    overflow: fullBleed || isSidebarLayout(clone) ? "hidden" : "visible",
    boxSizing: "border-box",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "normal",
    hyphens: "manual",
    transform: "none",
    boxShadow: "none",
  });
  // Keep grid anatomy LTR; place the rail by language (HE right / EN left).
  const english = clone.classList.contains("cv-lang-en");
  if (
    clone.classList.contains("layout-premium") ||
    clone.classList.contains("layout-charcoal") ||
    clone.classList.contains("layout-navy") ||
    clone.classList.contains("layout-azure") ||
    clone.classList.contains("layout-cobalt") ||
    clone.classList.contains("layout-sidebar") ||
    clone.classList.contains("layout-split")
  ) {
    clone.style.direction = "ltr";
  }
  if (clone.classList.contains("layout-premium")) {
    Object.assign(clone.style, {
      direction: "ltr",
      display: "grid",
      gridTemplateColumns: english ? "30% 70%" : "70% 30%",
      gridTemplateRows: "auto minmax(0, 1fr)",
      gridTemplateAreas: english ? '"side head" "side main"' : '"head side" "main side"',
      columnGap: "0",
      rowGap: "0",
      background: "#ffffff",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    });
    const paintRail = (el: Element | null, bg: string) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.background = bg;
      el.style.WebkitPrintColorAdjust = "exact";
      el.style.printColorAdjust = "exact";
    };
    const sidebar = clone.querySelector(".cv-sidebar");
    if (sidebar instanceof HTMLElement) {
      Object.assign(sidebar.style, {
        gridArea: "side",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: "100%",
        maxHeight: "100%",
        paddingBottom: "2rem",
        boxSizing: "border-box",
        background: "#454545",
        color: "#f6f6f6",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      });
      const inner = sidebar.querySelector(".cv-sidebar-inner");
      paintRail(inner, "#454545");
      if (inner instanceof HTMLElement) {
        Object.assign(inner.style, {
          paddingTop: "0.55rem",
          paddingLeft: "0.75rem",
          paddingRight: "0.75rem",
          paddingBottom: "2.25rem",
          boxSizing: "border-box",
          height: "auto",
          minHeight: "0",
          maxHeight: "none",
          flex: "1 1 0",
        });
      }
      paintRail(sidebar.querySelector(".cv-photo-block"), "#3a3a3a");
      const railPad = sidebar.querySelector(".cv-sidebar-rail-pad");
      paintRail(railPad, "#454545");
      if (railPad instanceof HTMLElement) {
        Object.assign(railPad.style, {
          display: "block",
          flex: "0 0 5rem",
          flexShrink: "0",
          height: "5rem",
          minHeight: "5rem",
          maxHeight: "5rem",
          width: "100%",
        });
      }
    }
    const header = clone.querySelector("#cv-header");
    if (header instanceof HTMLElement) header.style.gridArea = "head";
    const main = clone.querySelector(".cv-main");
    if (main instanceof HTMLElement) {
      main.style.gridArea = "main";
      main.style.background = "#ffffff";
    }
  } else if (clone.classList.contains("layout-charcoal")) {
    Object.assign(clone.style, {
      direction: "ltr",
      display: "grid",
      gridTemplateColumns: english ? "minmax(0, 0.34fr) minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 0.34fr)",
      gridTemplateRows: "auto 1fr",
      gridTemplateAreas: english ? '"side head" "side main"' : '"head side" "main side"',
    });
  } else if (clone.classList.contains("layout-navy")) {
    Object.assign(clone.style, {
      direction: "ltr",
      display: "grid",
      gridTemplateColumns: english ? "minmax(0, 0.36fr) minmax(0, 0.64fr)" : "minmax(0, 0.64fr) minmax(0, 0.36fr)",
      gridTemplateRows: "auto auto 1fr",
      gridTemplateAreas: english
        ? '"photo main" "head main" "side main"'
        : '"main photo" "main head" "main side"',
      background: "#ffffff",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    });
    // Same display:contents pitfall as Cobalt — flatten rail for html2canvas.
    promotePhotoRailForCapture(clone, english, "navy");
  } else if (clone.classList.contains("layout-cobalt")) {
    Object.assign(clone.style, {
      direction: "ltr",
      display: "grid",
      gridTemplateColumns: english ? "minmax(0, 0.34fr) minmax(0, 0.66fr)" : "minmax(0, 0.66fr) minmax(0, 0.34fr)",
      gridTemplateRows: "auto auto 1fr",
      gridTemplateAreas: english
        ? '"photo main" "head main" "side main"'
        : '"main photo" "main head" "main side"',
      background: "#ffffff",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    });
    // html2canvas drops most display:contents descendants — promote rail nodes
    // so photo + contact/skills actually paint into the PDF.
    promotePhotoRailForCapture(clone, english, "cobalt");
  } else if (clone.classList.contains("layout-azure")) {
    Object.assign(clone.style, {
      direction: "ltr",
      display: "grid",
      gridTemplateColumns: english
        ? "minmax(0, 0.4fr) 1px minmax(0, 1fr)"
        : "minmax(0, 1fr) 1px minmax(0, 0.4fr)",
      gridTemplateRows: "auto 1fr",
      gridTemplateAreas: english
        ? '"head head head" "side rule main"'
        : '"head head head" "main rule side"',
    });
  } else if (clone.classList.contains("layout-sidebar") || clone.classList.contains("layout-split")) {
    const cols = clone.querySelector(".cv-columns");
    if (cols instanceof HTMLElement) {
      Object.assign(cols.style, {
        direction: "ltr",
        display: "grid",
        gridTemplateColumns: english ? "minmax(0, 0.34fr) minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 0.34fr)",
        gridTemplateAreas: english ? '"side main"' : '"main side"',
      });
    }
  }
  if (!fullBleed && !isSidebarLayout(clone)) {
    clone.style.display = "block";
  }

  prepareCaptureRoot(host, window);
  fitClassicCaptureToOnePage(host);
  lockCaptureSheetHeight(host);
  return host;
}

function cleanupCapture() {
  const host = document.getElementById("qc-print-host");
  document.documentElement.classList.remove("qc-exporting");
  if (!host) return;
  host.classList.remove("qc-capturing");
  host.replaceChildren();
  host.removeAttribute("style");
}

function isMobileUa() {
  return /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent || "");
}

function isIOS() {
  return /iP(hone|ad|od)/i.test(navigator.userAgent || "");
}

/**
 * Save PDF via <a download> in the same user-gesture turn when possible.
 * Never navigator.share here — and never window.open the site/blob as a page.
 */
async function downloadPdfBlob(blob, filename, pdf) {
  if (!blob || blob.size < 100) throw new Error("empty pdf");
  const safeName = shareSafeFilename(filename);

  if (pdf && typeof pdf.save === "function" && !isIOS()) {
    try {
      pdf.save(safeName);
      return "saved";
    } catch {
      /* fall through */
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = safeName;
    a.rel = "noopener";
    a.type = "application/pdf";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return "anchor";
  } catch {
    throw new Error("pdf-download-failed");
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

/** Share ONLY the PDF file (no title/text/url — those make iOS attach the page link). */
export async function sharePdfFileOnly(blob, filename) {
  if (!blob || blob.size < 100) throw new Error("empty pdf");
  const safeName = shareSafeFilename(filename);
  const file = new File([blob], safeName, { type: "application/pdf" });
  if (!(typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }))) {
    await downloadPdfBlob(blob, safeName, null);
    return "download-fallback";
  }
  await navigator.share({ files: [file] });
  return "shared";
}

/** Immediate save helper for a fresh tap after the PDF was prepared. */
export async function savePdfFileOnly(blob, filename) {
  if (!blob || blob.size < 100) throw new Error("empty pdf");
  const safeName = shareSafeFilename(filename);
  // On iOS, Save to Files lives in the share sheet — but still files-only.
  if (isIOS()) {
    try {
      return await sharePdfFileOnly(blob, safeName);
    } catch (err) {
      if (err && err.name === "AbortError") return "aborted";
      /* fall through to anchor */
    }
  }
  return downloadPdfBlob(blob, safeName, null);
}

function isMostlyBlankRow(data, width, y) {
  const offset = y * width * 4;
  let ink = 0;
  for (let x = 0; x < width; x += 3) {
    const i = offset + x * 4;
    if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) {
      ink += 1;
      if (ink > 8) return false;
    }
  }
  return true;
}

function findSplitY(canvas, idealY, minY) {
  if (idealY >= canvas.height) return canvas.height;
  // getImageData on large canvases can freeze mobile Safari for tens of seconds.
  if (isMobileUa()) return idealY;
  const ctx = canvas.getContext("2d");
  const { width } = canvas;
  const search = Math.min(90, Math.max(0, idealY - minY));
  const data = ctx.getImageData(0, Math.max(0, idealY - search), width, search + 1).data;
  for (let dy = search; dy >= 0; dy -= 1) {
    const y = idealY - search + dy;
    const localY = y - (idealY - search);
    if (isMostlyBlankRow(data, width, localY)) return Math.max(minY + 1, y);
  }
  return idealY;
}

function isSafePdfUri(href) {
  return /^(mailto:|https?:\/\/)/i.test(String(href || "").trim());
}

function collectLinkBoxes(host) {
  const view = host.ownerDocument?.defaultView;
  const hostRect = host.getBoundingClientRect();
  if (!view || hostRect.width < 1 || hostRect.height < 1) return [];

  return [...host.querySelectorAll("a[href]")].flatMap((node) => {
    if (node.tagName !== "A") return [];
    const href = String(node.getAttribute("href") || "").trim();
    if (!isSafePdfUri(href)) return [];
    const cs = view.getComputedStyle(node);
    if (cs.display === "none" || cs.visibility === "hidden") return [];
    const r = node.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return [];
    return [
      {
        href,
        x: r.left - hostRect.left,
        y: r.top - hostRect.top,
        w: r.width,
        h: r.height,
      },
    ];
  });
}

function overlayPdfLinks(pdf, links, pageTopPx, pageBottomPx, sx, sy, pxPerMm, marginMm) {
  for (const box of links) {
    const x = box.x * sx;
    const y = box.y * sy;
    const w = box.w * sx;
    const h = box.h * sy;
    const top = Math.max(y, pageTopPx);
    const bottom = Math.min(y + h, pageBottomPx);
    if (bottom - top < 0.5 || w < 0.5) continue;
    pdf.link(
      marginMm + x / pxPerMm,
      marginMm + (top - pageTopPx) / pxPerMm,
      w / pxPerMm,
      (bottom - top) / pxPerMm,
      { url: box.href },
    );
  }
}

function isCanvasRegionBlank(canvas, y0, height) {
  const h = Math.min(canvas.height - y0, Math.max(0, Math.ceil(height)));
  if (h <= 0) return true;
  const ctx = canvas.getContext("2d");
  const { width } = canvas;
  const data = ctx.getImageData(0, Math.max(0, Math.floor(y0)), width, h).data;
  let inkRows = 0;
  for (let row = 0; row < h; row += 3) {
    if (!isMostlyBlankRow(data, width, row)) {
      inkRows += 1;
      if (inkRows > 2) return false;
    }
  }
  return true;
}

/** Crop tiny bottom overflow so one-page CVs don't sprout a stub page 2. */
function clampCanvasToPageBounds(canvas) {
  if (!canvas?.width || !canvas?.height) return canvas;
  const pagePxH = Math.max(1, Math.floor((PAGE_H_MM * canvas.width) / PAGE_W_MM));
  if (canvas.height <= pagePxH + 1) {
    if (canvas.height !== pagePxH && canvas.height >= pagePxH - 2) {
      const exact = document.createElement("canvas");
      exact.width = canvas.width;
      exact.height = pagePxH;
      const ctx = exact.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exact.width, exact.height);
      ctx.drawImage(canvas, 0, 0);
      return exact;
    }
    return canvas;
  }
  const overflow = canvas.height - pagePxH;
  // Crop larger stubs too when the overflow is only a sidebar fragment / blank margin.
  const softLimit = Math.ceil(pagePxH * 0.22);
  if (overflow <= softLimit || isCanvasRegionBlank(canvas, pagePxH, overflow) || isSidebarStubSlice(canvas, pagePxH, overflow)) {
    const cropped = document.createElement("canvas");
    cropped.width = canvas.width;
    cropped.height = pagePxH;
    const ctx = cropped.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cropped.width, cropped.height);
    ctx.drawImage(canvas, 0, 0, canvas.width, pagePxH, 0, 0, canvas.width, pagePxH);
    return cropped;
  }
  return canvas;
}

/** True when leftover pixels are only a dark sidebar strip (blank stub page 2). */
function isSidebarStubSlice(canvas, y0, height) {
  const h = Math.min(canvas.height - y0, Math.max(0, Math.ceil(height)));
  if (h <= 0) return true;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { width } = canvas;
  const data = ctx.getImageData(0, Math.max(0, Math.floor(y0)), width, h).data;
  const sideW = Math.ceil(width * 0.34);
  let inkSide = 0;
  let inkMid = 0;
  for (let row = 0; row < h; row += 2) {
    for (let x = 0; x < width; x += 3) {
      const i = (row * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 245 && g > 245 && b > 245) continue;
      if (x < sideW || x >= width - sideW) inkSide += 1;
      else inkMid += 1;
      if (inkMid > 35) return false;
    }
  }
  return inkMid <= 35 && inkSide >= 0;
}

function addCanvasPages(pdf, canvas, links, hostWidth, hostHeight, opts = {}) {
  const marginMm = opts.marginMm ?? 0;
  const startNewPage = !!opts.startNewPage;
  const usableW = PAGE_W_MM - marginMm * 2;
  const usableH = PAGE_H_MM - marginMm * 2;
  const source = clampCanvasToPageBounds(canvas);
  const pxPerMm = source.width / usableW;
  const pagePxH = Math.floor(usableH * pxPerMm);
  const sx = source.width / Math.max(1, hostWidth);
  const sy = source.height / Math.max(1, hostHeight);

  const pushJpeg = (imgCanvas, sliceMm, linkY0, linkY1) => {
    pdf.addImage(
      imgCanvas.toDataURL("image/jpeg", 0.9),
      "JPEG",
      marginMm,
      marginMm,
      usableW,
      sliceMm,
      undefined,
      "FAST",
    );
    overlayPdfLinks(pdf, links, linkY0, linkY1, sx, sy, pxPerMm, marginMm);
  };

  /* Single A4 sheet — skip blank-row scanning and extra canvas copies. */
  if (!startNewPage && source.height <= pagePxH + 2) {
    pushJpeg(source, Math.min(usableH, source.height / pxPerMm), 0, source.height);
    return;
  }

  let y = 0;
  let first = !startNewPage;
  const totalH = source.height;

  while (y < totalH - 1) {
    const remaining = totalH - y;
    if (y > 0 && remaining < pagePxH * 0.1) break;
    if (remaining < Math.max(10, pagePxH * 0.03) && isCanvasRegionBlank(source, y, remaining)) {
      break;
    }
    // Drop blank / sidebar-fragment continuation pages.
    if (y > 0 && (isCanvasRegionBlank(source, y, remaining) || isSidebarStubSlice(source, y, remaining))) {
      break;
    }
    let next = Math.min(totalH, y + pagePxH);
    if (next < totalH) {
      next = findSplitY(source, next, y + Math.floor(pagePxH * 0.55));
      if (totalH - next < pagePxH * 0.1) next = totalH;
    }
    const sliceH = Math.max(1, next - y);
    if (isCanvasRegionBlank(source, y, sliceH)) {
      if (!first || startNewPage) break;
    }

    const slice = document.createElement("canvas");
    slice.width = source.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(source, 0, y, source.width, sliceH, 0, 0, source.width, sliceH);

    if (!first) pdf.addPage();
    first = false;
    pushJpeg(slice, Math.min(usableH, sliceH / pxPerMm), y, y + sliceH);
    y += sliceH;
  }
}

async function captureToCanvas(el) {
  const html2canvas = window.html2canvas;
  if (typeof html2canvas !== "function") {
    throw new Error("html2canvas missing");
  }

  const html = document.documentElement;
  const prevDir = html.getAttribute("dir");
  const prevDirStyle = html.style.direction;
  html.setAttribute("dir", "ltr");
  html.style.direction = "ltr";

  function measureLinks(host) {
    const rect = host.getBoundingClientRect();
    return {
      links: collectLinkBoxes(host),
      width: rect.width || host.offsetWidth || A4_CSS_PX,
      height: rect.height || host.offsetHeight || 1,
    };
  }

  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    fitClassicCaptureToOnePage(el);
    lockCaptureSheetHeight(el);
    let linkMeta = measureLinks(el);
    const sheet = el.querySelector?.(".cv-print-sheet");
    const premium = sheet instanceof HTMLElement && sheet.classList.contains("layout-premium");
    const lockedH =
      sheet instanceof HTMLElement ? Math.ceil(parseFloat(sheet.style.height) || sheet.offsetHeight || 0) : 0;
    const width = Math.max(A4_CSS_PX, Math.ceil(el.offsetWidth || el.scrollWidth || A4_CSS_PX));
    const height = premium
      ? A4_CSS_H
      : Math.max(
          A4_CSS_H,
          lockedH || Math.ceil(el.offsetHeight || el.scrollHeight || 1),
        );
    // ~150–160 DPI is enough for crisp A4 resumes; higher scale makes export feel stuck.
    const mobile = isMobileUa();
    const scale = Math.min(mobile ? 1.5 : 2, MAX_CANVAS / width, MAX_CANVAS / height);

    const canvas = await withTimeout(
      html2canvas(el, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width,
        height,
        windowWidth: Math.max(width, A4_CSS_PX),
        windowHeight: Math.max(height, A4_CSS_H),
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 6000,
        onclone: (doc) => {
          doc.documentElement.setAttribute("dir", "ltr");
          doc.documentElement.style.direction = "ltr";
          doc.documentElement.classList.add("qc-exporting");
          copyCssVars(document.documentElement, doc.documentElement);
          const host = doc.getElementById("qc-print-host");
          if (host instanceof HTMLElement) {
            host.classList.add("qc-capturing");
            host.setAttribute("dir", cvCaptureDir());
            Object.assign(host.style, {
              display: "block",
              position: "static",
              left: "auto",
              top: "auto",
              width: A4_CSS_PX + "px",
              minWidth: A4_CSS_PX + "px",
              maxWidth: A4_CSS_PX + "px",
              height: "auto",
              minHeight: A4_CSS_H + "px",
              maxHeight: "none",
              padding: "0",
              margin: "0",
              background: "#ffffff",
              overflow: "visible",
              transform: "none",
              direction: cvCaptureDir(),
            });
            const sheet = host.querySelector(".cv-print-sheet");
            if (sheet instanceof HTMLElement) {
              const fullBleed = isFullBleedLayout(sheet) || isSidebarLayout(sheet);
              const premium = sheet.classList.contains("layout-premium");
              sheet.style.minHeight = A4_CSS_H + "px";
              sheet.style.height = A4_CSS_H + "px";
              sheet.style.maxHeight = premium || fullBleed ? A4_CSS_H + "px" : "none";
              sheet.style.overflow = fullBleed || premium ? "hidden" : "visible";
              sheet.style.transform = "none";
              if (fullBleed || premium) sheet.style.padding = "0";
              if (premium) {
                host.style.height = A4_CSS_H + "px";
                host.style.maxHeight = A4_CSS_H + "px";
                host.style.overflow = "hidden";
              }
            }
            prepareCaptureRoot(host, doc.defaultView);
            lockCaptureSheetHeight(host);
            if (sheet instanceof HTMLElement && sheet.classList.contains("layout-premium")) {
              sheet.style.height = A4_CSS_H + "px";
              sheet.style.maxHeight = A4_CSS_H + "px";
              sheet.style.overflow = "hidden";
              host.style.height = A4_CSS_H + "px";
              host.style.maxHeight = A4_CSS_H + "px";
              host.style.overflow = "hidden";
              ensurePremiumSidebarFooter(sheet);
            }
            const cloned = measureLinks(host);
            if (cloned.links.length) linkMeta = cloned;
          }
        },
      }),
      40000,
      "pdf-capture-timeout",
    );
    return { canvas, ...linkMeta };
  } finally {
    if (prevDir == null) html.removeAttribute("dir");
    else html.setAttribute("dir", prevDir);
    html.style.direction = prevDirStyle;
  }
}

export async function exportHighResPdf(opts = {}) {
  if (!isUnlocked()) {
    throw new Error("payment required");
  }
  if (window.__qcPdfBusy) {
    const started = Number(window.__qcPdfBusyAt || 0);
    const lockMs = isMobileUa() ? 45000 : 90000;
    if (started && Date.now() - started < lockMs) return;
    setSpinner(false);
  }
  const download = opts.download !== false;

  document.getElementById("cv-preview-wrapper")?.classList.add("paid");
  document.body.classList.add("paid");
  document.documentElement.classList.add("qc-paid");
  document.documentElement.classList.remove("qc-unpaid");

  const JsPDF = getJsPdfCtor();
  if (!JsPDF) {
    throw new Error("jsPDF missing");
  }

  setSpinner(true);
  const hardLimit = setTimeout(() => {
    if (window.__qcPdfBusy) setSpinner(false);
  }, 60000);
  const host = prepareCaptureClone();
  if (!host) {
    clearTimeout(hardLimit);
    setSpinner(false);
    throw new Error("missing cv-target");
  }

  try {
    await waitForCvFonts();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    fitClassicCaptureToOnePage(host);
    lockCaptureSheetHeight(host);

    const captured = await withTimeout(captureToCanvas(host), 40000, "pdf-export-timeout");
    const canvas = captured.canvas;
    if (!canvas.width || !canvas.height) throw new Error("empty canvas");

    const sheet = host.querySelector(".cv-print-sheet");
    const fullBleed = sheet ? isFullBleedLayout(sheet) : false;
    // Edge-to-edge for sidebar layouts; tiny inset for classic sheets (padding already in clone).
    const marginMm = fullBleed ? 0 : 0;

    const pdf = new JsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });
    addCanvasPages(pdf, canvas, captured.links, captured.width, captured.height, {
      marginMm,
    });

    if (typeof window.QCCoverLetter?.enabled === "function" && window.QCCoverLetter.enabled()) {
      window.QCCoverLetter.render?.();
      const letterHost = prepareCaptureClone("cl-target");
      if (letterHost) {
        const letterCap = await withTimeout(captureToCanvas(letterHost), 25000, "pdf-letter-timeout");
        if (letterCap.canvas?.width) {
          addCanvasPages(pdf, letterCap.canvas, letterCap.links, letterCap.width, letterCap.height, {
            marginMm: 0,
            startNewPage: true,
          });
        }
      }
    }

    const filename = fileBase() + ".pdf";
    const blob = pdf.output("blob");
    if (!blob || blob.size < 100) throw new Error("empty pdf");

    // Drop overlay BEFORE share/download so the system sheet is usable on phones.
    cleanupCapture();
    setSpinner(false);
    clearTimeout(hardLimit);

    if (download) {
      await downloadPdfBlob(blob, filename, pdf);
    }
    return { blob, filename };
  } catch (err) {
    cleanupCapture();
    setSpinner(false);
    throw err;
  } finally {
    clearTimeout(hardLimit);
    cleanupCapture();
    setSpinner(false);
  }
}

window.QCHighResPdf = async function gatedHighResPdf() {
  if (!isUnlocked()) throw new Error("payment required");
  return exportHighResPdf();
};
