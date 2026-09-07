// @ts-nocheck
const A4_CSS_PX = 794;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 10;

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

  Object.assign(host.style, {
    display: "block",
    position: "fixed",
    left: "0",
    top: "0",
    width: A4_CSS_PX + "px",
    padding: "28px",
    margin: "0",
    background: "#ffffff",
    color: "#0f172a",
    zIndex: "2147483645",
    overflow: "visible",
    pointerEvents: "none",
    boxSizing: "border-box",
  });

  flattenUnsupportedColors(host, window);
  return clone;
}

function cleanupCapture() {
  const host = document.getElementById("qc-print-host");
  if (!host) return;
  host.replaceChildren();
  host.removeAttribute("style");
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function addCanvasPages(pdf, canvas) {
  const imgW = PAGE_W_MM - MARGIN_MM * 2;
  const pxPerMm = canvas.width / imgW;
  const pagePxH = Math.floor((PAGE_H_MM - MARGIN_MM * 2) * pxPerMm);
  let y = 0;
  let first = true;

  while (y < canvas.height) {
    const sliceH = Math.min(pagePxH, canvas.height - y);
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
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN_MM, MARGIN_MM, imgW, sliceMm, undefined, "FAST");
    y += sliceH;
  }
}

async function captureToCanvas(el) {
  const html2canvas = window.html2canvas;
  if (typeof html2canvas !== "function") {
    throw new Error("html2canvas missing");
  }
  const scale = Math.min(2, 4096 / Math.max(el.scrollWidth, 1));
  return html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: A4_CSS_PX,
    onclone: (doc) => {
      const sheet = doc.querySelector(".cv-print-sheet");
      if (sheet instanceof HTMLElement) flattenUnsupportedColors(sheet, doc.defaultView);
    },
  });
}

export async function exportHighResPdf() {
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
  const sheet = prepareCaptureClone();
  if (!sheet) {
    setSpinner(false);
    throw new Error("missing cv-target");
  }

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const canvas = await captureToCanvas(sheet);
    if (!canvas.width || !canvas.height) throw new Error("empty canvas");

    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    addCanvasPages(pdf, canvas);

    const filename = fileBase() + ".pdf";
    const blob = pdf.output("blob");
    triggerBlobDownload(blob, filename);
  } finally {
    cleanupCapture();
    setSpinner(false);
  }
}

window.QCHighResPdf = exportHighResPdf;
