"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatDate";

export const RECOVERY_FILE_NAME = "bio-dosha-12-recovery-codes.txt";

/**
 * The ten one-time recovery codes, shown once after 2-step sign-in is turned
 * on, with ways to keep them: copy, download as .txt, or print. Printing
 * prints only this panel (everything else on the page is print:hidden).
 * The codes stay in memory only; nothing is written to browser storage.
 */
export function RecoveryCodesPanel({
  codes,
  email,
  createdAt,
}: {
  codes: string[];
  email?: string | null;
  createdAt: Date;
}) {
  const t = useTranslations("authFlows.mfa.save");
  const tFile = useTranslations("authFlows.mfa.file");
  const locale = useLocale();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const created = formatDateTime(createdAt, locale);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 4000);
  }

  function download() {
    const lines = [
      tFile("title"),
      ...(email ? [tFile("account", { email })] : []),
      tFile("created", { date: created }),
      "",
      ...codes.map((code, i) => `${String(i + 1).padStart(2, " ")}. ${code}`),
      "",
      tFile("note"),
    ];
    // BOM so older Windows editors read the Cyrillic text as UTF-8.
    const blob = new Blob([`﻿${lines.join("\r\n")}\r\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = RECOVERY_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-4">
      {/* Heading for the printed sheet only. */}
      <div className="hidden print:block">
        <p className="text-xl font-bold">{tFile("title")}</p>
        {email && <p className="mt-1 text-sm">{tFile("account", { email })}</p>}
        <p className="text-sm">{tFile("created", { date: created })}</p>
      </div>

      <ol
        aria-label={t("listLabel")}
        className="grid grid-cols-1 gap-2 rounded-xl bg-surface-container-low p-3 min-[420px]:grid-cols-2 print:grid-cols-2 print:bg-transparent print:p-0"
      >
        {codes.map((code, i) => (
          <li
            key={code}
            className="flex items-baseline gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 font-mono text-[15px] font-semibold tracking-wider text-on-surface ring-1 ring-outline-variant/30 print:ring-black/40"
          >
            <span className="w-5 shrink-0 text-right text-xs font-normal text-on-surface-variant" aria-hidden="true">
              {i + 1}.
            </span>
            <span className="select-all">{code}</span>
          </li>
        ))}
      </ol>

      <p className="hidden text-sm print:block">{tFile("note")}</p>

      {/* Buttons keep their natural width and wrap to a new row when the labels do not fit. */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" variant="outline" onClick={copyAll} className="h-11 flex-auto px-4 font-semibold">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {copyState === "copied" ? "check" : "content_copy"}
          </span>
          {copyState === "copied" ? t("copied") : t("copyAll")}
        </Button>
        <Button type="button" variant="outline" onClick={download} className="h-11 flex-auto px-4 font-semibold">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            download
          </span>
          {t("download")}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()} className="h-11 flex-auto px-4 font-semibold">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            print
          </span>
          {t("print")}
        </Button>
      </div>
      <p aria-live="polite" className="text-xs text-on-surface-variant print:hidden">
        {copyState === "copied" ? t("copiedNote") : copyState === "failed" ? t("copyFailed") : ""}
      </p>
    </div>
  );
}
