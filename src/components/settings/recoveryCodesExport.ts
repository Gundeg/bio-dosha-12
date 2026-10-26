/**
 * Save or print one-time recovery codes. Everything happens in memory: the
 * codes are never written to localStorage, cookies or the server log.
 */

export interface RecoverySheet {
  /** Document title, e.g. "Bio-Dosha-12 recovery codes". */
  title: string;
  /** Lines shown above the codes (account, date). */
  meta: string[];
  codes: string[];
  /** Advice shown under the codes. */
  note: string;
  locale: string;
}

/** Plain text (CRLF line ends, UTF-8 BOM) so old Windows Notepad shows Cyrillic correctly. */
export function recoveryText(sheet: RecoverySheet): string {
  const lines = [sheet.title, ...sheet.meta, "", ...sheet.codes.map((c, i) => `${String(i + 1).padStart(2, " ")}. ${c}`), "", sheet.note];
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function downloadTextFile(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);
}

/**
 * Opens a small print-only page with the codes and the print dialog.
 * Returns false when the browser blocked the new window.
 */
export function printRecoverySheet(sheet: RecoverySheet): boolean {
  const win = window.open("", "_blank", "width=720,height=800");
  if (!win) return false;
  const codes = sheet.codes.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
  const meta = sheet.meta.map((m) => `<p class="meta">${escapeHtml(m)}</p>`).join("");
  win.document.open();
  win.document.write(`<!doctype html>
<html lang="${escapeHtml(sheet.locale)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(sheet.title)}</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #0b1c30; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  .meta { margin: 2px 0; font-size: 13px; color: #3e494a; }
  ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 32px; margin: 24px 0; padding-left: 24px; }
  li { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; font-size: 17px; letter-spacing: 0.06em; }
  .note { font-size: 13px; border-top: 1px solid #bdc8ca; padding-top: 12px; }
</style>
</head>
<body>
<h1>${escapeHtml(sheet.title)}</h1>
${meta}
<ol>${codes}</ol>
<p class="note">${escapeHtml(sheet.note)}</p>
</body>
</html>`);
  win.document.close();
  win.addEventListener("afterprint", () => win.close());
  win.focus();
  win.print();
  return true;
}
