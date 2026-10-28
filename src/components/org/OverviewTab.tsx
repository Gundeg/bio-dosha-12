"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Callout, Section, StatusBadge } from "@/components/kit";
import { IconTile } from "@/components/kit/layout";
import { formatDate } from "@/lib/formatDate";
import { formatMnt } from "@/lib/formatNumber";
import { UsageMeter } from "@/components/settings/shared";
import { CLINICAL_ROLES, MANAGER_ROLES, planName, type MeMembership } from "@/components/settings/types";
import { StepList } from "./StepList";
import type { OrgDetail } from "./types";
import { Icon, type IconName } from "@/components/ui/icon";

export function OverviewTab({ detail, membership }: { detail: OrgDetail; membership: MeMembership }) {
  return (
    <div className="space-y-6">
      <StatusCard detail={detail} />
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PlanCard detail={detail} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <RoleCard membership={membership} />
          <QuickLinks detail={detail} membership={membership} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ detail }: { detail: OrgDetail }) {
  const t = useTranslations("org.overview");
  const locale = useLocale();
  const org = detail.organization;

  if (org.status === "ACTIVE") {
    return (
      <Callout tone="success" icon="verified" title={t("activeTitle")}>
        {org.verifiedAt ? t("activeBody", { date: formatDate(org.verifiedAt, locale, "long") }) : t("activeBodyNoDate")}
      </Callout>
    );
  }

  if (org.status === "SUSPENDED") {
    return (
      <Callout tone="danger" icon="block" title={t("suspendedTitle")}>
        <p>
          {org.suspendedAt
            ? t("suspendedSince", { date: formatDate(org.suspendedAt, locale, "long") })
            : t("suspendedNoDate")}
        </p>
        {org.suspendedReason && (
          <p className="mt-1">
            <span className="font-semibold">{t("suspendedReason")}</span> {org.suspendedReason}
          </p>
        )}
        <p className="mt-1">{t("suspendedContact")}</p>
      </Callout>
    );
  }

  return (
    <Section title={t("pendingSection")}>
      <Callout tone="warning" icon="hourglass_top" title={t("pendingTitle")} className="mb-5">
        {t("pendingBody")}
      </Callout>
      <h3 className="mb-3 text-sm font-semibold text-on-surface">{t("nextTitle")}</h3>
      <StepList
        current={0}
        steps={[
          { title: t("next1Title"), body: t("next1Body") },
          { title: t("next2Title"), body: t("next2Body") },
          { title: t("next3Title"), body: t("next3Body") },
        ]}
      />
    </Section>
  );
}

function PlanCard({ detail }: { detail: OrgDetail }) {
  const t = useTranslations("org.overview");
  const tKit = useTranslations("kit");
  const locale = useLocale();
  const { plan, usage } = detail;
  const price = formatMnt(plan.priceMonthlyMnt);
  const pdf = plan.limits.pdfReports !== false;

  return (
    <Section title={t("planTitle")} description={t("planDescription")}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <IconTile name="workspace_premium" tone="primary" />
            <div>
              <p className="text-xs font-medium text-on-surface-variant">{t("planName")}</p>
              <p className="text-lg font-semibold text-on-surface">{planName(plan, locale)}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-on-surface-variant">{t("price")}</p>
            <p className="text-lg font-semibold text-on-surface tabular-nums">
              {price ? t("pricePerMonth", { price }) : t("priceFree")}
            </p>
            {plan.currentPeriodEnd && (
              <p className="text-xs text-on-surface-variant">
                {t("validUntil", { date: formatDate(plan.currentPeriodEnd, locale, "long") })}
              </p>
            )}
          </div>
        </div>

        <UsageMeter
          label={t("practitioners")}
          used={usage.practitioners}
          limit={plan.limits.maxPractitioners}
          hint={t("practitionersHint")}
        />
        <UsageMeter label={t("patients")} used={usage.patients} limit={plan.limits.maxPatients} />

        <div className="flex items-center justify-between gap-3 border-t border-outline-variant pt-4">
          <span className="text-sm font-medium text-on-surface">{t("pdfReports")}</span>
          <StatusBadge tone={pdf ? "success" : "neutral"} icon={pdf ? "check" : "close"}>
            {pdf ? tKit("yes") : tKit("no")}
          </StatusBadge>
        </div>

        <p className="flex items-start gap-1.5 text-sm text-on-surface-variant">
          <Icon name="support_agent" className="size-4 mt-0.5" />
          {t("changePlan")}
        </p>
      </div>
    </Section>
  );
}

function RoleCard({ membership }: { membership: MeMembership }) {
  const t = useTranslations("org");
  return (
    <Section title={t("overview.roleTitle")}>
      <p className="text-base font-semibold text-on-surface">{t(`roles.${membership.role}.label`)}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{t(`roles.${membership.role}.description`)}</p>
    </Section>
  );
}

function QuickLinks({ detail, membership }: { detail: OrgDetail; membership: MeMembership }) {
  const t = useTranslations("org.overview");
  const canManage = MANAGER_ROLES.includes(membership.role);
  const clinicalOpen = CLINICAL_ROLES.includes(membership.role) && detail.organization.status === "ACTIVE";

  const links = [
    clinicalOpen && { href: "/patients", icon: "stethoscope", label: t("linkPatients"), hint: t("linkPatientsHint") },
    { href: "/org?tab=members", icon: "group", label: t("linkMembers"), hint: t("linkMembersHint") },
    canManage && { href: "/org?tab=invites", icon: "forward_to_inbox", label: t("linkInvites"), hint: t("linkInvitesHint") },
  ].filter((l): l is { href: string; icon: IconName; label: string; hint: string } => !!l);

  return (
    <Section title={t("linksTitle")} bodyClassName="p-2">
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
            >
              <IconTile name={link.icon} tone="primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-on-surface">{link.label}</span>
                <span className="block text-xs text-on-surface-variant">{link.hint}</span>
              </span>
              <Icon name="chevron_right" className="size-5 text-on-surface-variant" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
