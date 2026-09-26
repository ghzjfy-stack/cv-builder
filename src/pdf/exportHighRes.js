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
  const english = cvCaptureDir() === "ltr";
  const raw = document.getElementById("in-name")?.value || (english ? "Resume" : "קורות_חיים");
  const safe =
    window.QCSanitize?.filename?.(raw) || String(raw).replace(/[^\w\u0590-\u05FF-]+/g, "_");
  return (english ? "Resume_" : "קורות_חיים_") + (safe || "resume");
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
    ["400", "500", "600", "700"].forEach((weight) => {
      loads.push(document.fonts.load(`${weight} 16px "${name}"`));
    });
  }
  if (document.fonts?.ready) loads.push(document.fonts.ready);
  if (loads.length) {
    try {
      await Promise.all(loads);
    } catch {
      /* fallback glyphs are fine */
    }
  }
}

function setSpinner(on) {
  const busy = !!on;
  window.__qcPdfBusy = busy;
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
  const nodes = [root, ...root.querySelectorAll("*")];
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const cs = win.getComputedStyle(node);
    node.style.color = cs.color;
    if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
      node.style.backgroundColor = cs.backgroundColor;
    }
    node.style.borderTopColor = cs.borderTopColor;
    node.style.borderRightColor = cs.borderRightColor;
    node.style.borderBottomColor = cs.borderBottomColor;
    node.style.borderLeftColor = cs.borderLeftColor;
    node.style.fontFamily = cs.fontFamily;
    // html2canvas often drops filter/blur — strip for fidelity.
    if (cs.filter && cs.filter !== "none") node.style.filter = "none";
    if (cs.backdropFilter && cs.backdropFilter !== "none") node.style.backdropFilter = "none";
  });
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
    if (!keepClip) {
      node.style.overflow = "visible";
      node.style.overflowX = "visible";
      node.style.overflowY = "visible";
      node.style.maxHeight = "none";
    } else {
      node.style.overflow = "hidden";
      node.style.maxHeight = "";
    }
    node.style.textOverflow = "clip";
    node.style.boxShadow = "none";
    node.style.transform = "none";
  });
  flattenUnsupportedColors(root, win);
}

function isSidebarLayout(el) {
  return (
    el.classList.contains("layout-sidebar") ||
    el.classList.contains("layout-split") ||
    el.classList.contains("layout-charcoal") ||
    el.classList.contains("layout-navy") ||
    el.classList.contains("layout-azure")
  );
}

function isFullBleedLayout(el) {
  return (
    el.classList.contains("layout-charcoal") ||
    el.classList.contains("layout-navy") ||
    el.classList.contains("layout-azure")
  );
}

/** Lock sheet to full A4 (or taller) so 1fr sidebar columns paint to the bottom. */
function lockCaptureSheetHeight(host) {
  const sheet = host?.querySelector?.(".cv-print-sheet");
  if (!(sheet instanceof HTMLElement)) return;
  const sidebarish = isSidebarLayout(sheet) || isFullBleedLayout(sheet);
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
  // Content that fits on one A4 must stay exactly one page (avoid a stub page 2).
  const fitsOne = contentH <= A4_CSS_H + 12;
  const needed = fitsOne ? A4_CSS_H : contentH;
  sheet.style.minHeight = `${needed}px`;
  sheet.style.height = `${needed}px`;
  sheet.style.overflow = "hidden";
  host.style.minHeight = `${needed}px`;
  host.style.height = fitsOne ? `${needed}px` : "auto";
  if (sidebarish) {
    sheet.querySelectorAll(".cv-sidebar, .cv-sidebar-inner, .cv-main, .cv-columns, .cv-photo-block, #cv-header").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.classList.contains("cv-photo") || el.closest?.(".cv-photo")) return;
      el.style.alignSelf = "stretch";
    });
    sheet.querySelectorAll(".cv-sidebar, .cv-sidebar-inner").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.height = "100%";
      el.style.minHeight = "100%";
    });
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
  if (!fullBleed && !isSidebarLayout(clone)) {
    clone.style.display = "block";
  }

  prepareCaptureRoot(host, window);
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
 * Best-effort PDF download across desktop, Android, and iOS Safari.
 * Prefer Web Share on mobile (saves to Files / opens share sheet);
 * fall back to <a download> + temporary tab open on iOS.
 */
async function downloadPdfBlob(blob, filename, pdf) {
  if (!blob || blob.size < 100) throw new Error("empty pdf");

  const file = new File([blob], filename, { type: "application/pdf" });
  if (isMobileUa() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    } catch (err) {
      if (err && err.name === "AbortError") return "aborted";
      /* fall through to classic download */
    }
  }

  if (pdf && typeof pdf.save === "function" && !isIOS()) {
    try {
      pdf.save(filename);
      return "saved";
    } catch {
      /* fall through */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  if (isIOS()) {
    try {
      window.open(url, "_blank", "noopener");
    } catch {
      /* Safari may block without a gesture — green button remains. */
    }
  }

  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 12000);
  return "anchor";
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
  if (overflow <= Math.ceil(pagePxH * 0.1)) {
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
  let y = 0;
  let first = !startNewPage;
  const totalH = source.height;

  while (y < totalH - 1) {
    const remaining = totalH - y;
    if (y > 0 && remaining < pagePxH * 0.1) break;
    if (remaining < Math.max(10, pagePxH * 0.03) && isCanvasRegionBlank(source, y, remaining)) {
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
    const sliceMm = Math.min(usableH, sliceH / pxPerMm);
    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.995),
      "JPEG",
      marginMm,
      marginMm,
      usableW,
      sliceMm,
      undefined,
      "SLOW",
    );
    overlayPdfLinks(pdf, links, y, y + sliceH, sx, sy, pxPerMm, marginMm);
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
    await waitForCvFonts();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    lockCaptureSheetHeight(el);
    let linkMeta = measureLinks(el);
    const sheet = el.querySelector?.(".cv-print-sheet");
    const lockedH =
      sheet instanceof HTMLElement ? Math.ceil(parseFloat(sheet.style.height) || sheet.offsetHeight || 0) : 0;
    const width = Math.max(A4_CSS_PX, Math.ceil(el.offsetWidth || el.scrollWidth || A4_CSS_PX));
    const height = Math.max(
      A4_CSS_H,
      lockedH || Math.ceil(el.offsetHeight || el.scrollHeight || 1),
    );
    // Prefer print-like DPI; keep mobile under memory limits.
    const dpr = Math.min(window.devicePixelRatio || 1, isMobileUa() ? 2.25 : 3);
    // Floor scale for crisp text; true vector export would rewrite the pipeline.
    const scale = Math.min(Math.max(dpr, isMobileUa() ? 2 : 2.75), MAX_CANVAS / width, MAX_CANVAS / height);

    const canvas = await html2canvas(el, {
      scale: Math.max(isMobileUa() ? 2 : 2.5, scale),
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
      imageTimeout: 15000,
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
            sheet.style.minHeight = A4_CSS_H + "px";
            sheet.style.height = A4_CSS_H + "px";
            sheet.style.maxHeight = "none";
            sheet.style.overflow = fullBleed ? "hidden" : "visible";
            sheet.style.transform = "none";
            if (fullBleed) sheet.style.padding = "0";
          }
          prepareCaptureRoot(host, doc.defaultView);
          lockCaptureSheetHeight(host);
          const cloned = measureLinks(host);
          if (cloned.links.length) linkMeta = cloned;
        }
      },
    });
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
    return;
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
  const host = prepareCaptureClone();
  if (!host) {
    setSpinner(false);
    throw new Error("missing cv-target");
  }

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await waitForCvFonts();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 80));
    lockCaptureSheetHeight(host);

    const captured = await captureToCanvas(host);
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
        const letterCap = await captureToCanvas(letterHost);
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
    if (download) {
      await downloadPdfBlob(blob, filename, pdf);
    }
    return { blob, filename };
  } finally {
    cleanupCapture();
    setSpinner(false);
  }
}

window.QCHighResPdf = async function gatedHighResPdf() {
  if (!isUnlocked()) throw new Error("payment required");
  return exportHighResPdf();
};
