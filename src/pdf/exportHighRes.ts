// @ts-nocheck
import { isUnlocked } from "../access/gate.js";

const A4_CSS_PX = 794;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 8;
const MAX_CANVAS = 8192;

function getJsPdfCtor() {
  return window.jspdf?.jsPDF || window.jsPDF;
}

function fileBase() {
  const raw = document.getElementById("in-name")?.value || "קורות_חיים";
  const safe = window.QCSanitize?.filename?.(raw) || String(raw).replace(/[^\w\u0590-\u05FF-]+/g, "_");
  return "קורות_חיים_" + (safe || "resume");
}

function copyCssVars(fromEl, toEl) {
  const cs = getComputedStyle(fromEl);
  ["--accent", "--cv-font", "--cv-scale", "--cv-leading"].forEach((name) => {
    const v = cs.getPropertyValue(name);
    if (v) toEl.style.setProperty(name, v);
  });
}

function setSpinner(on) {
  const el = document.getElementById("pdf-spinner");
  if (!el) return;
  el.classList.toggle("hidden", !on);
  el.classList.toggle("flex", on);
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
  });
}

function prepareCaptureRoot(root, view) {
  const win = view || window;
  const nodes = [root, ...root.querySelectorAll("*")];
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.overflow = "visible";
    node.style.overflowX = "visible";
    node.style.overflowY = "visible";
    node.style.maxHeight = "none";
    node.style.textOverflow = "clip";
    node.style.boxShadow = "none";
  });
  flattenUnsupportedColors(root, win);
}

function ensureCaptureHost() {
  let host = document.getElementById("qc-print-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "qc-print-host";
    host.setAttribute("dir", "rtl");
    document.body.appendChild(host);
  }
  return host;
}

function prepareCaptureClone() {
  const source = document.getElementById("cv-target");
  if (!source) return null;

  if (typeof window.updateCV === "function") window.updateCV();
  window.QCDraft?.save?.();

  const host = ensureCaptureHost();
  host.replaceChildren();
  copyCssVars(document.documentElement, host);

  const clone = source.cloneNode(true);
  clone.removeAttribute("id");
  clone.classList.add("cv-print-sheet");
  host.appendChild(clone);

  host.classList.add("qc-capturing");
  Object.assign(host.style, {
    display: "block",
    position: "fixed",
    left: "0",
    top: "0",
    width: A4_CSS_PX + "px",
    minWidth: A4_CSS_PX + "px",
    maxWidth: A4_CSS_PX + "px",
    padding: "28px 44px 36px",
    margin: "0",
    background: "#ffffff",
    color: "#0f172a",
    zIndex: "2147483645",
    overflow: "visible",
    pointerEvents: "none",
    boxSizing: "border-box",
    transform: "none",
    direction: "rtl",
  });

  Object.assign(clone.style, {
    display: "block",
    width: "100%",
    maxWidth: "100%",
    margin: "0",
    overflow: "visible",
    boxSizing: "border-box",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "normal",
    hyphens: "manual",
  });

  prepareCaptureRoot(host, window);
  return host;
}

function cleanupCapture() {
  const host = document.getElementById("qc-print-host");
  if (!host) return;
  host.classList.remove("qc-capturing");
  host.replaceChildren();
  host.removeAttribute("style");
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
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
    return [{
      href,
      x: r.left - hostRect.left,
      y: r.top - hostRect.top,
      w: r.width,
      h: r.height,
    }];
  });
}

function overlayPdfLinks(pdf, links, pageTopPx, pageBottomPx, sx, sy, pxPerMm) {
  for (const box of links) {
    const x = box.x * sx;
    const y = box.y * sy;
    const w = box.w * sx;
    const h = box.h * sy;
    const top = Math.max(y, pageTopPx);
    const bottom = Math.min(y + h, pageBottomPx);
    if (bottom - top < 0.5 || w < 0.5) continue;
    pdf.link(
      MARGIN_MM + x / pxPerMm,
      MARGIN_MM + (top - pageTopPx) / pxPerMm,
      w / pxPerMm,
      (bottom - top) / pxPerMm,
      { url: box.href },
    );
  }
}

function addCanvasPages(pdf, canvas, links, hostWidth, hostHeight) {
  const usableW = PAGE_W_MM - MARGIN_MM * 2;
  const usableH = PAGE_H_MM - MARGIN_MM * 2;
  const pxPerMm = canvas.width / usableW;
  const pagePxH = Math.floor(usableH * pxPerMm);
  const sx = canvas.width / Math.max(1, hostWidth);
  const sy = canvas.height / Math.max(1, hostHeight);
  let y = 0;
  let first = true;

  while (y < canvas.height) {
    let next = Math.min(canvas.height, y + pagePxH);
    if (next < canvas.height) {
      next = findSplitY(canvas, next, y + Math.floor(pagePxH * 0.55));
    }
    const sliceH = Math.max(1, next - y);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    if (!first) pdf.addPage();
    first = false;
    const sliceMm = sliceH / pxPerMm;
    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.95),
      "JPEG",
      MARGIN_MM,
      MARGIN_MM,
      usableW,
      sliceMm,
      undefined,
      "FAST",
    );
    overlayPdfLinks(pdf, links, y, y + sliceH, sx, sy, pxPerMm);
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
    let linkMeta = measureLinks(el);
    const width = Math.max(A4_CSS_PX, Math.ceil(el.scrollWidth || el.offsetWidth || A4_CSS_PX));
    const height = Math.max(1, Math.ceil(el.scrollHeight || el.offsetHeight || 1));
    const scale = Math.min(2, MAX_CANVAS / width, MAX_CANVAS / height);

    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width,
      height,
      windowWidth: Math.max(width, A4_CSS_PX),
      windowHeight: Math.max(height, 400),
      scrollX: 0,
      scrollY: -window.scrollY,
      imageTimeout: 8000,
      onclone: (doc) => {
        doc.documentElement.setAttribute("dir", "ltr");
        doc.documentElement.style.direction = "ltr";
        copyCssVars(document.documentElement, doc.documentElement);
        const host = doc.getElementById("qc-print-host");
        if (host instanceof HTMLElement) {
          host.classList.add("qc-capturing");
          host.setAttribute("dir", "rtl");
          Object.assign(host.style, {
            display: "block",
            position: "static",
            left: "auto",
            top: "auto",
            width: A4_CSS_PX + "px",
            minWidth: A4_CSS_PX + "px",
            maxWidth: A4_CSS_PX + "px",
            padding: "28px 44px 36px",
            margin: "0",
            background: "#ffffff",
            overflow: "visible",
            transform: "none",
            direction: "rtl",
          });
          prepareCaptureRoot(host, doc.defaultView);
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

export async function exportHighResPdf() {
  if (!isUnlocked()) {
    throw new Error("payment required");
  }

  const modal = document.getElementById("payment-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.style.display = "none";
  }

  document.getElementById("cv-preview-wrapper")?.classList.add("paid");

  const JsPDF = getJsPdfCtor();
  if (!JsPDF) throw new Error("jsPDF missing");

  setSpinner(true);
  const host = prepareCaptureClone();
  if (!host) {
    setSpinner(false);
    throw new Error("missing cv-target");
  }

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 50));

    const captured = await captureToCanvas(host);
    const canvas = captured.canvas;
    if (!canvas.width || !canvas.height) throw new Error("empty canvas");

    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    addCanvasPages(pdf, canvas, captured.links, captured.width, captured.height);

    const filename = fileBase() + ".pdf";
    const blob = pdf.output("blob");
    if (!blob || blob.size < 100) throw new Error("empty pdf");
    try {
      pdf.save(filename);
    } catch {
      triggerBlobDownload(blob, filename);
    }
  } finally {
    cleanupCapture();
    setSpinner(false);
  }
}

window.QCHighResPdf = async function gatedHighResPdf() {
  if (!isUnlocked()) throw new Error("payment required");
  return exportHighResPdf();
};
