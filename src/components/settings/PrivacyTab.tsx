"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/kit";
import { DeleteAccountSection } from "./DeleteAccountSection";
import type { Me } from "./types";
import { Icon } from "@/components/ui/icon";

export function PrivacyTab({ me }: { me: Me }) {
  const t = useTranslations("settings.privacy");
  return (
    <div className="space-y-6">
      <Section title={t("exportTitle")} description={t("exportDescription")}>
        <ul className="mb-5 space-y-2 text-sm text-on-surface">
          {(["exportIncludes1", "exportIncludes2", "exportIncludes3"] as const).map((key) => (
            <li key={key} className="flex items-start gap-2">
              <Icon name="check_circle" className="size-4 mt-0.5 text-primary" />
              {t(key)}
            </li>
          ))}
          <li className="flex items-start gap-2 text-on-surface-variant">
            <Icon name="do_not_disturb_on" className="size-4 mt-0.5" />
            {t("exportExcludes")}
          </li>
        </ul>
        <a
          href="/api/account/export"
          download
          className={buttonVariants({ size: "lg" })}
        >
          <Icon name="download" className="size-4" />
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
