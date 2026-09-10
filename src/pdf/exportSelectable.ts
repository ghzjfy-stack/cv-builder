// @ts-nocheck
import { isUnlocked } from "../access/gate.js";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;

const FONT_URLS = {
  regular: [
    "https://cdn.jsdelivr.net/gh/googlefonts/rubik@main/fonts/ttf/Rubik-Regular.ttf",
    "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansHebrew/hinted/ttf/NotoSansHebrew-Regular.ttf",
  ],
  bold: [
    "https://cdn.jsdelivr.net/gh/googlefonts/rubik@main/fonts/ttf/Rubik-Bold.ttf",
    "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansHebrew/hinted/ttf/NotoSansHebrew-Bold.ttf",
  ],
};

let fontCache = null;

function getJsPdfCtor() {
  return window.jspdf?.jsPDF || window.jsPDF;
}

function isEnglish() {
  const source = document.getElementById("cv-target");
  return source?.getAttribute("dir") === "ltr" || window.QCCvLang === "en";
}

function fileBase() {
  const english = isEnglish();
  const raw = document.getElementById("in-name")?.value || (english ? "Resume" : "קורות_חיים");
  const safe = window.QCSanitize?.filename?.(raw) || String(raw).replace(/[^\w\u0590-\u05FF-]+/g, "_");
  return (english ? "Resume_" : "קורות_חיים_") + (safe || "resume");
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

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchFirst(urls) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(String(res.status));
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1000) throw new Error("tiny font");
      return bufferToBase64(buf);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("font fetch failed");
}

async function loadFonts() {
  if (fontCache) return fontCache;
  const [regular, bold] = await Promise.all([fetchFirst(FONT_URLS.regular), fetchFirst(FONT_URLS.bold)]);
  fontCache = { regular, bold };
  return fontCache;
}

function registerFonts(pdf, fonts) {
  pdf.addFileToVFS("QC-Regular.ttf", fonts.regular);
  pdf.addFileToVFS("QC-Bold.ttf", fonts.bold);
  pdf.addFont("QC-Regular.ttf", "QCResume", "normal");
  pdf.addFont("QC-Bold.ttf", "QCResume", "bold");
}

function accentHex() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#1e293b";
  const hex = raw.replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return hex;
  return "1e293b";
}

function collect() {
  if (typeof window.QCExport?.data === "function") return window.QCExport.data();
  const g = (id) => window.QCSanitize?.text?.(document.getElementById(id)?.value) || String(document.getElementById(id)?.value || "");
  return {
    name: g("in-name"),
    title: g("in-title"),
    phone: g("in-phone"),
    email: g("in-email"),
    location: g("in-location"),
    linkedin: g("in-linkedin"),
    summary: g("in-summary"),
    experience: g("in-experience"),
    education: g("in-education"),
    military: g("in-military"),
    skills: g("in-skills"),
    languages: g("in-languages"),
    references: g("in-references"),
  };
}

function labels() {
  if (isEnglish()) {
    return {
      summary: "Professional Summary",
      experience: "Work Experience",
      education: "Education",
      military: "Military / National Service",
      skills: "Skills",
      languages: "Languages",
      references: "References",
    };
  }
  return {
    summary: "תקציר מקצועי",
    experience: "ניסיון תעסוקתי",
    education: "השכלה",
    military: "שירות צבאי / לאומי",
    skills: "כישורים",
    languages: "שפות",
    references: "המלצות",
  };
}

function hasHebrew(text) {
  return /[\u0590-\u05FF]/.test(String(text || ""));
}

export async function exportSelectablePdf(opts = {}) {
  if (!isUnlocked()) throw new Error("payment required");
  const download = opts.download !== false;

  const JsPDF = getJsPdfCtor();
  if (!JsPDF) throw new Error("jsPDF missing");

  const fonts = await loadFonts();
  const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  registerFonts(pdf, fonts);

  const data = collect();
  const L = labels();
  const rtl = !isEnglish();
  const color = accentHex();
  const maxW = PAGE_W - MARGIN * 2;
  const xLeft = MARGIN;
  const xRight = PAGE_W - MARGIN;
  let y = MARGIN + 2;
  const name = data.name || (rtl ? "קורות חיים" : "Resume");

  pdf.setProperties({
    title: name,
    subject: rtl ? "קורות חיים" : "Curriculum Vitae",
    author: name,
    keywords: "resume, CV, ATS, QuickCV",
    creator: "QuickCV",
  });
  if (typeof pdf.setLanguage === "function") pdf.setLanguage(rtl ? "he-IL" : "en-US");

  function alignFor(text) {
    return rtl || hasHebrew(text) ? "right" : "left";
  }

  function xFor(align) {
    return align === "right" ? xRight : xLeft;
  }

  function ensureSpace(needed) {
    if (y + needed <= PAGE_H - MARGIN) return;
    pdf.addPage();
    y = MARGIN;
  }

  function writeLines(text, size, style, leading, opts) {
    const body = String(text || "").replace(/\r\n/g, "\n").trim();
    if (!body) return;
    pdf.setFont("QCResume", style || "normal");
    pdf.setFontSize(size);
    const align = opts?.align || alignFor(body);
    const lines = pdf.splitTextToSize(body, maxW);
    const gap = leading || size * 0.42;
    lines.forEach((line) => {
      ensureSpace(gap + 1);
      const drawOpts = { align };
      if (align === "right") drawOpts.R2L = hasHebrew(line) || rtl;
      pdf.text(line, xFor(align), y, drawOpts);
      y += gap;
    });
    y += opts?.after || 1.2;
  }

  function heading(title) {
    ensureSpace(12);
    y += 2;
    pdf.setDrawColor(color);
    pdf.setLineWidth(0.35);
    pdf.line(xLeft, y, xRight, y);
    y += 6;
    pdf.setTextColor(color);
    writeLines(title, 11, "bold", 5.2, { after: 2.2, align: rtl ? "right" : "left" });
    pdf.setTextColor(15, 23, 42);
  }

  pdf.setTextColor(15, 23, 42);
  writeLines(name, 22, "bold", 9, { after: 1.4 });
  if (data.title) writeLines(data.title, 12, "normal", 5.6, { after: 2.4 });

  const contact = [data.phone, data.email, data.location, data.linkedin].filter(Boolean).join("  ·  ");
  if (contact) writeLines(contact, 9.5, "normal", 4.6, { after: 3 });

  const sections = [
    ["summary", data.summary],
    ["experience", data.experience],
    ["education", data.education],
    ["military", data.military],
    ["skills", data.skills],
    ["languages", data.languages],
    ["references", data.references],
  ];
  sections.forEach(([key, value]) => {
    if (!value) return;
    heading(L[key]);
    writeLines(value, 10.5, "normal", 5.1, { after: 2.5 });
  });

  if (typeof window.QCCoverLetter?.enabled === "function" && window.QCCoverLetter.enabled()) {
    window.QCCoverLetter.render?.();
    pdf.addPage();
    y = MARGIN + 2;
    pdf.setTextColor(color);
    writeLines(rtl ? "מכתב מקדים" : "Cover Letter", 14, "bold", 7, { after: 3 });
    pdf.setTextColor(15, 23, 42);
    const letter = window.QCCoverLetter.buildText?.() || "";
    writeLines(letter, 11, "normal", 5.4, { after: 2 });
  }

  const filename = fileBase() + ".pdf";
  const blob = pdf.output("blob");
  if (!blob || blob.size < 100) throw new Error("empty pdf");
  if (download) {
    try {
      pdf.save(filename);
    } catch {
      triggerBlobDownload(blob, filename);
    }
  }
  return { blob, filename };
}

window.QCSelectablePdf = exportSelectablePdf;
