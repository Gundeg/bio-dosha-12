"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/states";
import { PageHeader, Section, StatCard, StatusBadge, useApiQuery } from "@/components/kit";
import { IconTile } from "@/components/kit/layout";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { ActivityChart, type DailyPoint } from "./ActivityChart";
import { ActivityList } from "./ActivityList";
import { LoadFailure, PageSkeleton, StaleNotice } from "./AdminStates";
import { useAdminViewer } from "./AdminViewer";
import { DateText } from "./badges";
import { useAdminLabels } from "./hooks";
import type { ActivityItem, PlanAudience } from "./lib";
import type { IconName } from "@/components/ui/icon";

/** GET /api/admin/overview */
interface OverviewResponse {
  totals: {
    users: number;
    staff: number;
    disabledUsers: number;
    organizations: { pending: number; active: number; suspended: number };
    practitioners: number;
    patients: number;
    personalProfiles: number;
    calculations30d: number;
  };
  series: DailyPoint[];
  pendingOrganizations: {
    id: string;
    name: string;
    type: string;
    city: string | null;
    createdAt: string;
    owner: { name: string; email: string } | null;
  }[];
  security: {
    staffWithoutMfa: number;
    membersWithoutMfa: number;
    failedLogins24h: number;
    blockedLogins24h: number;
    disabledUsers: number;
  };
  plans: {
    id: string;
    code: string;
    nameMn: string;
    nameEn: string;
    audience: PlanAudience;
    isDefault: boolean;
    subscribers: number;
  }[];
  recentActivity: (ActivityItem & { organizationId: string | null })[];
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <ButtonLink href={href} variant="link" className="px-2">
      {children}
    </ButtonLink>
  );
}

export function AdminOverview() {
  const t = useTranslations("admin");
  const viewer = useAdminViewer();
  const labels = useAdminLabels();
  const { data, error, reload } = useApiQuery<OverviewResponse>("/api/admin/overview");

  const header = <PageHeader title={t("overview.title")} description={t("overview.description")} />;

  if (!data) {
    if (error) {
      return (
        <div>
          {header}
          <LoadFailure error={error} onRetry={reload} />
        </div>
      );
    }
    return <PageSkeleton cards={8} sections={3} />;
  }

  const { totals, security } = data;
  const pending = totals.organizations.pending;

  const securityRows: {
    key: string;
    icon: IconName;
    value: number;
    href?: string;
  }[] = [
    { key: "staffWithoutMfa", icon: "admin_panel_settings", value: security.staffWithoutMfa, href: "/admin/users?type=staff&mfa=off" },
    { key: "membersWithoutMfa", icon: "phonelink_lock", value: security.membersWithoutMfa, href: "/admin/users?type=member&mfa=off" },
    {
      key: "failedLogins24h",
      icon: "password",
      value: security.failedLogins24h,
      href: viewer.isSuperadmin ? "/admin/audit?action=auth.login.failure" : undefined,
    },
    {
      key: "blockedLogins24h",
      icon: "front_hand",
      value: security.blockedLogins24h,
      href: viewer.isSuperadmin ? "/admin/audit?action=auth.login.blocked" : undefined,
    },
    { key: "disabledUsers", icon: "person_off", value: security.disabledUsers, href: "/admin/users?status=disabled" },
  ];
  const securityIssues = securityRows.filter((r) => r.value > 0).length;

  return (
    <div className="space-y-6">
      {header}
      <StaleNotice error={error} onRetry={reload} />

      <section aria-labelledby="overview-totals">
        <h2 id="overview-totals" className="sr-only">
          {t("overview.totalsTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t("overview.stats.users")}
            value={formatNumber(totals.users)}
            hint={t("overview.stats.usersHint", { count: totals.staff })}
            icon="group"
            href="/admin/users"
          />
          <StatCard
            label={t("overview.stats.activeOrgs")}
            value={formatNumber(totals.organizations.active)}
            hint={t("overview.stats.activeOrgsHint")}
            icon="domain"
            tone="primary"
            href="/admin/organizations?status=ACTIVE"
          />
          <StatCard
            label={t("overview.stats.pending")}
            value={formatNumber(pending)}
            hint={pending > 0 ? t("overview.stats.pendingHint") : t("overview.stats.pendingNone")}
            icon="pending_actions"
            tone={pending > 0 ? "warning" : "default"}
            href="/admin/organizations?status=PENDING"
          />
          <StatCard
            label={t("overview.stats.suspended")}
            value={formatNumber(totals.organizations.suspended)}
            hint={t("overview.stats.suspendedHint")}
            icon="block"
            href="/admin/organizations?status=SUSPENDED"
          />
          <StatCard
            label={t("overview.stats.practitioners")}
            value={formatNumber(totals.practitioners)}
            hint={t("overview.stats.practitionersHint")}
            icon="stethoscope"
          />
          <StatCard
            label={t("overview.stats.patients")}
            value={formatNumber(totals.patients)}
            hint={t("overview.stats.countOnly")}
            icon="patient_list"
          />
          <StatCard
            label={t("overview.stats.profiles")}
            value={formatNumber(totals.personalProfiles)}
            hint={t("overview.stats.profilesHint")}
            icon="family_restroom"
          />
          <StatCard
            label={t("overview.stats.calculations")}
            value={formatNumber(totals.calculations30d)}
            hint={t("overview.stats.countOnly")}
            icon="calculate"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Section
          id="overview-attention"
          className="lg:col-span-3"
          title={t("overview.attention.title")}
          description={t("overview.attention.description")}
          actions={
            pending > data.pendingOrganizations.length ? (
              <SectionLink href="/admin/organizations?status=PENDING">{t("overview.attention.viewAll", { count: pending })}</SectionLink>
            ) : undefined
          }
        >
          {data.pendingOrganizations.length === 0 ? (
            <EmptyState
              className="border-none py-8"
              icon="task_alt"
              title={t("overview.attention.emptyTitle")}
              body={t("overview.attention.emptyBody")}
            />
          ) : (
            <ul className="divide-y divide-outline-variant/20">
              {data.pendingOrganizations.map((org) => (
                <li key={org.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">{org.name}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {labels.orgType(org.type)}
                      {org.city ? ` · ${org.city}` : ""}
                      {" · "}
                      {t("overview.attention.registered")} <DateText value={org.createdAt} />
                    </p>
                    <p className="mt-0.5 break-words text-xs text-on-surface-variant">
                      {org.owner ? `${org.owner.name} · ${org.owner.email}` : t("overview.attention.noOwner")}
                    </p>
                  </div>
                  <ButtonLink href={`/admin/organizations/${org.id}`} variant="outline" size="lg" className="shrink-0">
                    {t("overview.attention.review")}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          id="overview-security"
          className="lg:col-span-2"
          title={t("overview.security.title")}
          description={
            securityIssues > 0 ? t("overview.security.issues", { count: securityIssues }) : t("overview.security.allClear")
          }
          bodyClassName="p-2"
        >
          <ul>
            {securityRows.map((row) => {
              const warn = row.value > 0;
              const body = (
                <>
                  <IconTile name={row.icon} tone={warn ? "warning" : "default"} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-on-surface">{t(`overview.security.${row.key}`)}</span>
                    <span className="block text-xs text-on-surface-variant">{t(`overview.security.${row.key}Hint`)}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-lg font-semibold tabular-nums text-on-surface">{formatNumber(row.value)}</span>
                    <StatusBadge tone={warn ? "warning" : "success"}>
                      {warn ? t("overview.security.check") : t("overview.security.ok")}
                    </StatusBadge>
                  </span>
                </>
              );
              const rowClass = "flex items-center gap-3 rounded-lg px-3 py-2.5";
              return (
                <li key={row.key}>
                  {row.href ? (
                    <Link
                      href={row.href}
                      className={cn(rowClass, "transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary")}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={rowClass}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <Section id="overview-chart" title={t("overview.chart.title")} description={t("overview.chart.description")}>
        <ActivityChart series={data.series} />
      </Section>

      <div className={cn("grid gap-6", viewer.isSuperadmin && "lg:grid-cols-2")}>
        <Section
          id="overview-plans"
          title={t("overview.plans.title")}
          description={t("overview.plans.description")}
          actions={<SectionLink href="/admin/plans">{t("overview.plans.manage")}</SectionLink>}
        >
          {data.plans.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">{t("overview.plans.empty")}</p>
          ) : (
            <div className="space-y-5">
              {(["INDIVIDUAL", "ORGANIZATION"] as const).map((audience) => {
                const plans = data.plans.filter((p) => p.audience === audience);
                if (plans.length === 0) return null;
                return (
                  <div key={audience}>
                    <h3 className="mb-2 text-xs font-semibold text-on-surface-variant">
                      {labels.audience(audience)}
                    </h3>
                    <ul className="divide-y divide-outline-variant/20">
                      {plans.map((plan) => (
                        <li key={plan.id} className="flex items-center gap-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface">
                              {labels.planName(plan)}
                              {plan.isDefault && <StatusBadge tone="primary">{t("plans.default")}</StatusBadge>}
                            </p>
                            <p className="font-mono text-[11px] text-on-surface-variant">{plan.code}</p>
                          </div>
                          <p className="shrink-0 text-right text-sm tabular-nums text-on-surface">
                            {t("plans.assignedCount", { count: plan.subscribers })}
                            {plan.isDefault && (
                              <span className="block text-[11px] text-on-surface-variant">{t("plans.plusDefaultUsers")}</span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {viewer.isSuperadmin && (
          <Section
            id="overview-activity"
            title={t("overview.activity.title")}
            description={t("overview.activity.description")}
            actions={<SectionLink href="/admin/audit">{t("overview.activity.openAudit")}</SectionLink>}
          >
            <ActivityList items={data.recentActivity} empty={t("overview.activity.empty")} />
          </Section>
        )}
      </div>
    </div>
  );
}
