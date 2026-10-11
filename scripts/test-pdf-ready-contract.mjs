/**
 * Simulates the mobile PDF ready-sheet contract:
 * 1) prepare builds a File-only payload
 * 2) share/save must NOT include url/text/title (iOS page-link bug)
 * 3) ASCII filename only
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/pdf/exportHighRes.ts", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /id="pdf-ready-sheet"/);
assert.match(html, /id="btn-pdf-ready-save"/);
assert.match(html, /id="btn-pdf-ready-whatsapp"/);

assert.match(main, /sharePdfFileOnly\(/);
assert.match(main, /savePdfFileOnly\(/);
assert.match(main, /openPdfReadySheet\(/);
assert.match(main, /onPdfReadyWhatsApp/);
assert.match(main, /onPdfReadySave/);

assert.match(exp, /export async function sharePdfFileOnly/);
assert.match(exp, /export async function savePdfFileOnly/);
assert.match(exp, /ASCII-only filenames/);
assert.doesNotMatch(exp, /window\.open\(url/);

// share helper must not pass title/text/url
const shareFn = exp.slice(exp.indexOf("export async function sharePdfFileOnly"));
const shareBody = shareFn.slice(0, shareFn.indexOf("export async function savePdfFileOnly"));
assert.match(shareBody, /navigator\.share\(\{\s*files:\s*\[file\]\s*\}\)/);
assert.doesNotMatch(shareBody, /title\s*:/);
assert.doesNotMatch(shareBody, /text\s*:/);
assert.doesNotMatch(shareBody, /url\s*:/);

console.log("pdf-ready-sheet contract OK");
