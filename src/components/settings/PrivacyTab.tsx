"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/kit";
import { cn } from "@/lib/utils";
import { DeleteAccountSection } from "./DeleteAccountSection";
import type { Me } from "./types";

export function PrivacyTab({ me }: { me: Me }) {
  const t = useTranslations("settings.privacy");
  return (
    <div className="space-y-6">
      <Section title={t("exportTitle")} description={t("exportDescription")}>
        <ul className="mb-5 space-y-2 text-sm text-on-surface">
          {(["exportIncludes1", "exportIncludes2", "exportIncludes3"] as const).map((key) => (
            <li key={key} className="flex items-start gap-2">
              <span className="material-symbols-outlined mt-px text-[18px] text-primary" aria-hidden="true">
                check_circle
              </span>
              {t(key)}
            </li>
          ))}
          <li className="flex items-start gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined mt-px text-[18px]" aria-hidden="true">
              do_not_disturb_on
            </span>
            {t("exportExcludes")}
          </li>
        </ul>
        <a
          href="/api/account/export"
          download
          className={cn(buttonVariants({ variant: "default" }), "h-10 px-5 font-semibold")}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            download
          </span>
          {t("exportButton")}
        </a>
        <p className="mt-2 text-xs text-on-surface-variant">{t("exportFormat")}</p>
      </Section>

      <Section title={t("noticeTitle")}>
        <p className="text-sm text-on-surface">
          {t.rich("noticeBody", {
            link: (chunks) => (
              <Link
                href="/privacy"
                className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </Section>

      <DeleteAccountSection me={me} />
    </div>
  );
}
