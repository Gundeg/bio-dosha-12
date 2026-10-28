import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";
import type { IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/kit/layout";

/** API error codes that mean "patient records are closed for you", each with its own explanation. */
export const CLINICAL_ACCESS_CODES = [
  "org_pending",
  "org_suspended",
  "no_organization",
  "not_clinical",
  "mfa_setup_required",
] as const;

export type ClinicalAccessCode = (typeof CLINICAL_ACCESS_CODES)[number];

export function isClinicalAccessCode(code: unknown): code is ClinicalAccessCode {
  return typeof code === "string" && (CLINICAL_ACCESS_CODES as readonly string[]).includes(code);
}

const STATES: Record<ClinicalAccessCode, { icon: IconName; tone: "warning" | "danger" | "info"; href: string }> = {
  org_pending: { icon: "hourglass_top", tone: "warning", href: "/org" },
  org_suspended: { icon: "block", tone: "danger", href: "/org" },
  no_organization: { icon: "domain_add", tone: "info", href: "/help#faq-organizations" },
  not_clinical: { icon: "badge", tone: "info", href: "/org" },
  mfa_setup_required: { icon: "phonelink_lock", tone: "warning", href: "/mfa-setup" },
};

const TONE = { warning: "warning", danger: "danger", info: "primary" } as const;

/**
 * Friendly explanation, with the next step, when the API closes patient
 * records (403 with one of CLINICAL_ACCESS_CODES). Used by the patient list,
 * the patient card and the reports page. Works in server and client components.
 */
export function ClinicalAccessState({
  code,
  organizationName,
  className,
}: {
  code: ClinicalAccessCode;
  organizationName?: string | null;
  className?: string;
}) {
  const t = useTranslations("clinical.access");
  const state = STATES[code];
  const titleId = `clinical-access-${code}`;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl bg-surface-container-lowest px-6 py-14 text-center shadow-ambient",
        className
      )}
    >
      <IconTile name={state.icon} tone={TONE[state.tone]} size="lg" />
      {organizationName && (
        <p className="text-xs font-medium text-on-surface-variant">{organizationName}</p>
      )}
      <h2 id={titleId} className="max-w-lg text-base font-semibold text-on-surface">
        {t(`${code}.title`)}
      </h2>
      <p className="max-w-lg text-sm leading-relaxed text-on-surface-variant">{t(`${code}.body`)}</p>
      <ButtonLink href={state.href} size="lg" className="mt-2">
        {t(`${code}.action`)}
      </ButtonLink>
    </section>
  );
}
