"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Callout, ConfirmDialog, DescriptionList, PageHeader, Section, StatusBadge, useApiQuery } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { ActivityList } from "./ActivityList";
import { LoadFailure, PageSkeleton, StaleNotice } from "./AdminStates";
import { linkDelivery, useAdminViewer } from "./AdminViewer";
import { AccountStatusBadge, DateText, MfaBadge, OrgStatusBadge, RoleBadge } from "./badges";
import { DeleteUserDialog, DeletionPreview } from "./DeleteUserDialog";
import { GuardedConfirmDialog } from "./GuardedConfirmDialog";
import { useAdminLabels } from "./hooks";
import { OneTimeLinkDialog, type OneTimeLink } from "./OneTimeLinkDialog";
import { PlanAssignDialog, type PlanAssignment } from "./PlanAssignDialog";
import { UsageMeter } from "./PlanUsage";
import {
  isStaffRole,
  limitOf,
  type ActivityItem,
  type DeletionPlan,
  type EffectivePlanInfo,
  type MemberStatus,
  type OneTimeLinkResponse,
  type OrgRole,
  type OrgStatus,
  type PlatformRole,
} from "./lib";

/** GET /api/admin/users/[userId] */
interface UserDetailResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: PlatformRole;
    locale: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    passwordChangedAt: string | null;
    privacyAcceptedAt: string | null;
    disabledAt: string | null;
    disabledReason: string | null;
    mfaEnabled: boolean;
    recoveryCodesLeft: number;
  };
  memberships: {
    id: string;
    role: OrgRole;
    status: MemberStatus;
    joinedAt: string;
    organization: { id: string; name: string; status: OrgStatus };
  }[];
  plan: EffectivePlanInfo;
  usage: { profiles: number; records: number };
  deletion: DeletionPlan;
  recentActivity: ActivityItem[];
}

type DialogName = "reset" | "signout" | "mfa" | "disable" | "enable" | "role" | "plan" | "delete";

/** One account action: what it does in a sentence, and its button. */
function ActionRow({
  icon,
  title,
  description,
  button,
  danger,
}: {
  icon: string;
  title: string;
  description: string;
  button: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <span
        className={cn(
          "material-symbols-outlined hidden size-9 shrink-0 items-center justify-center rounded-xl text-[20px] sm:flex",
          danger ? "bg-red-50 text-red-700" : "bg-surface-container text-on-surface-variant"
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-on-surface">{title}</p>
        <p className="mt-0.5 text-on-surface-variant">{description}</p>
      </div>
      <div className="shrink-0">{button}</div>
    </li>
  );
}

export function UserDetail({ userId }: { userId: string }) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const viewer = useAdminViewer();
  const labels = useAdminLabels();
  const router = useRouter();
  const url = `/api/admin/users/${encodeURIComponent(userId)}`;
  const { data, error, reload } = useApiQuery<UserDetailResponse>(url);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [link, setLink] = useState<OneTimeLink | null>(null);

  const backHref = "/admin/users";
  const backLabel = t("user.back");

  if (!data) {
    if (error) {
      return (
        <div>
          <PageHeader backHref={backHref} backLabel={backLabel} title={t("user.titleFallback")} />
          <LoadFailure error={error} onRetry={reload} backHref={backHref} backLabel={backLabel} notFoundTitle={t("user.notFound")} />
        </div>
      );
    }
    return <PageSkeleton sections={3} />;
  }

  const { user } = data;
  const isAdminTarget = user.role === "ADMIN";
  // Mirrors the API's guard rails so nobody is offered an action that will be refused.
  const blockedReason =
    user.id === viewer.id
      ? "self"
      : user.role === "SUPERADMIN"
        ? "superadmin"
        : isAdminTarget && !viewer.isSuperadmin
          ? "staff"
          : null;
  const canAct = blockedReason === null;
  const resetDelivery = linkDelivery(viewer);
  const mfaRequired = isStaffRole(user.role) || data.memberships.some((m) => m.status === "ACTIVE");

  const dialogProps = (name: DialogName) => ({
    open: dialog === name,
    onOpenChange: (open: boolean) => setDialog(open ? name : null),
  });
  const openDialog = (name: DialogName) => () => setDialog(name);

  async function patch(body: Record<string, unknown>) {
    await apiFetch(url, { method: "PATCH", body: JSON.stringify(body) });
  }
  async function createResetLink() {
    const res = await apiFetch<OneTimeLinkResponse>(`${url}/reset-link`, { method: "POST" });
    // Only the superadmin receives the raw link; otherwise it was emailed (or the email failed).
    const resetUrl = res.resetUrl ?? null;
    setLink({ url: resetUrl, emailSent: res.emailSent, email: user.email, expiresAt: res.expiresAt });
    if (resetUrl || res.emailSent) {
      toast.success(resetUrl ? t("user.reset.done") : t("user.reset.doneEmailed", { email: user.email }));
    } else {
      toast.error(t("link.notDeliveredTitle"));
    }
    reload();
  }
  async function signOut() {
    await patch({ action: "signout" });
    toast.success(t("user.signout.done", { name: user.name }));
    reload();
  }
  async function resetMfa() {
    await patch({ action: "reset_mfa" });
    toast.success(t("user.mfa.done", { name: user.name }));
    reload();
  }
  async function disable({ reason }: { reason: string }) {
    await patch({ action: "disable", reason });
    toast.success(t("user.disable.done", { name: user.name }));
    reload();
  }
  async function enable() {
    await patch({ action: "enable" });
    toast.success(t("user.enable.done", { name: user.name }));
    reload();
  }
  async function changeRole() {
    const role = isAdminTarget ? "INDIVIDUAL" : "ADMIN";
    await patch({ action: "set_role", role });
    toast.success(role === "ADMIN" ? t("user.role.promoted", { name: user.name }) : t("user.role.demoted", { name: user.name }));
    reload();
  }
  async function savePlan(assignment: PlanAssignment) {
    await patch({ action: "set_plan", ...assignment });
    toast.success(assignment.planCode ? t("planAssign.saved") : t("planAssign.removed"));
    reload();
  }
  function deleted() {
    toast.success(t("user.delete.done", { email: user.email }));
    router.push(backHref);
  }

  const localeLabel = user.locale === "en" ? t("user.account.localeEn") : user.locale === "mn" ? t("user.account.localeMn") : t("user.account.localeDefault");
  const profileLimit = limitOf(data.plan.limits, "maxProfiles");

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={backHref}
        backLabel={backLabel}
        eyebrow={t("user.eyebrow")}
        title={<span className="break-words">{user.name}</span>}
        description={
          <span className="flex flex-col gap-2">
            <span className="break-all">{user.email}</span>
            <span className="flex flex-wrap gap-2">
              <RoleBadge role={user.role} />
              <AccountStatusBadge disabled={!!user.disabledAt} />
              <MfaBadge enabled={user.mfaEnabled} required={mfaRequired} />
              {user.id === viewer.id && (
                <StatusBadge tone="primary" dot={false}>
                  {t("common.you")}
                </StatusBadge>
              )}
            </span>
          </span>
        }
      />

      <StaleNotice error={error} onRetry={reload} />

      {user.disabledAt && (
        <Callout tone="danger" icon="person_off" title={t("user.disabledCallout.title", { date: labels.date(user.disabledAt) ?? "" })}>
          {t("user.disabledCallout.reason", { reason: user.disabledReason ?? "—" })}
        </Callout>
      )}

      {blockedReason === "self" && (
        <Callout
          tone="info"
          icon="manage_accounts"
          title={t("user.blocked.selfTitle")}
          action={
            <ButtonLink href="/settings" variant="outline" className="h-10 px-4">
              {t("user.blocked.openSettings")}
            </ButtonLink>
          }
        >
          {t("user.blocked.selfBody")}
        </Callout>
      )}
      {blockedReason === "superadmin" && (
        <Callout tone="info" icon="shield_person" title={t("user.blocked.superadminTitle")}>
          {t("user.blocked.superadminBody")}
        </Callout>
      )}
      {blockedReason === "staff" && (
        <Callout tone="info" icon="admin_panel_settings" title={t("user.blocked.staffTitle")}>
          {t("user.blocked.staffBody")}
        </Callout>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Section id="user-account" title={t("user.account.title")}>
            <DescriptionList
              items={[
                { label: t("user.account.created"), value: <DateText value={user.createdAt} withTime /> },
                { label: t("user.account.lastLogin"), value: <DateText value={user.lastLoginAt} withTime emptyLabel={tk("never")} /> },
                {
                  label: t("user.account.passwordChanged"),
                  value: <DateText value={user.passwordChangedAt} withTime emptyLabel={t("user.account.notRecorded")} />,
                },
                {
                  label: t("user.account.privacyAccepted"),
                  value: <DateText value={user.privacyAcceptedAt} withTime emptyLabel={t("user.account.notRecorded")} />,
                },
                { label: t("user.account.language"), value: localeLabel },
                {
                  label: t("user.account.mfa"),
                  value: user.mfaEnabled
                    ? t("user.account.mfaOn")
                    : mfaRequired
                      ? t("user.account.mfaOffRequired")
                      : t("user.account.mfaOffOptional"),
                },
                {
                  label: t("user.account.recoveryCodes"),
                  value: user.mfaEnabled ? (
                    <span className={cn("tabular-nums", user.recoveryCodesLeft <= 2 && "font-semibold text-amber-800")}>
                      {t("user.account.recoveryCodesLeft", { count: user.recoveryCodesLeft })}
                    </span>
                  ) : (
                    "—"
                  ),
                },
                { label: t("user.account.role"), value: labels.role(user.role) },
              ]}
            />
          </Section>

          <Section id="user-orgs" title={t("user.orgs.title")} description={t("user.orgs.description")}>
            {data.memberships.length === 0 ? (
              <p className="py-4 text-center text-sm text-on-surface-variant">{t("user.orgs.empty")}</p>
            ) : (
              <ul className="divide-y divide-outline-variant/20">
                {data.memberships.map((m) => (
                  <li key={m.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/organizations/${m.organization.id}`}
                        className="font-semibold text-on-surface hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {m.organization.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {labels.orgRole(m.role)} · {t("user.orgs.joined", { date: labels.date(m.joinedAt) ?? "" })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <OrgStatusBadge status={m.organization.status} />
                      {m.status === "DISABLED" && <StatusBadge tone="danger">{t("org.members.disabledHere")}</StatusBadge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            id="user-plan"
            title={t("user.plan.title")}
            actions={
              canAct ? (
                <Button variant="outline" className="h-10 px-4" onClick={openDialog("plan")}>
                  {t("user.plan.change")}
                </Button>
              ) : undefined
            }
            bodyClassName="space-y-4"
          >
            <div>
              <p className="font-headline text-lg font-bold text-on-surface">{labels.planName(data.plan)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                <span className="font-mono">{data.plan.code}</span>
                <StatusBadge tone={data.plan.source === "subscription" ? "primary" : "neutral"} dot={false}>
                  {labels.planSource(data.plan.source)}
                </StatusBadge>
              </p>
              {data.plan.currentPeriodEnd && (
                <p className="mt-2 text-xs text-on-surface-variant">
                  {t("org.plan.validUntil", { date: labels.date(data.plan.currentPeriodEnd) ?? "" })}
                </p>
              )}
              {data.plan.note && <p className="mt-1 text-xs text-on-surface-variant">{t("org.plan.note", { note: data.plan.note })}</p>}
            </div>
            <UsageMeter label={t("limits.maxProfiles")} used={data.usage.profiles} limit={profileLimit} />
            <div className="flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-3 text-sm">
              <span className="text-on-surface-variant">{t("user.plan.calculations")}</span>
              <span className="font-semibold tabular-nums text-on-surface">{formatNumber(data.usage.records)}</span>
            </div>
            <p className="text-xs text-on-surface-variant">{t("user.plan.countsOnly")}</p>
          </Section>

          {viewer.isSuperadmin && (
            <Section
              id="user-activity"
              title={t("user.activity.title")}
              description={t("user.activity.description")}
              actions={
                <Link
                  href={`/admin/audit?actor=${encodeURIComponent(user.email)}`}
                  className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t("common.openAudit")}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              }
            >
              <ActivityList items={data.recentActivity} empty={t("user.activity.empty")} />
            </Section>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {canAct && (
            <Section id="user-actions" title={t("user.actions.title")} description={t("user.actions.description")}>
              <ul className="divide-y divide-outline-variant/20">
                <ActionRow
                  icon="key"
                  title={t("user.reset.action")}
                  description={
                    resetDelivery === "shown"
                      ? t("user.reset.summary")
                      : resetDelivery === "emailed"
                        ? t("user.reset.summaryEmailed")
                        : t("link.adminEmailOff")
                  }
                  button={
                    <Button
                      variant="outline"
                      className="h-10 px-4"
                      disabled={resetDelivery === "unavailable"}
                      onClick={openDialog("reset")}
                    >
                      {resetDelivery === "emailed" ? t("user.reset.buttonEmailed") : t("user.reset.button")}
                    </Button>
                  }
                />
                <ActionRow
                  icon="logout"
                  title={t("user.signout.action")}
                  description={t("user.signout.summary")}
                  button={
                    <Button variant="outline" className="h-10 px-4" onClick={openDialog("signout")}>
                      {t("user.signout.button")}
                    </Button>
                  }
                />
                {user.mfaEnabled && (
                  <ActionRow
                    icon="lock_reset"
                    title={t("user.mfa.action")}
                    description={t("user.mfa.summary")}
                    button={
                      <Button variant="outline" className="h-10 px-4" onClick={openDialog("mfa")}>
                        {t("user.mfa.button")}
                      </Button>
                    }
                  />
                )}
                {user.disabledAt ? (
                  <ActionRow
                    icon="person_check"
                    title={t("user.enable.action")}
                    description={t("user.enable.summary")}
                    button={
                      <Button className="h-10 px-4 font-semibold" onClick={openDialog("enable")}>
                        {t("user.enable.button")}
                      </Button>
                    }
                  />
                ) : (
                  <ActionRow
                    icon="person_off"
                    danger
                    title={t("user.disable.action")}
                    description={t("user.disable.summary")}
                    button={
                      <Button
                        variant="outline"
                        className="h-10 px-4 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={openDialog("disable")}
                      >
                        {t("user.disable.button")}
                      </Button>
                    }
                  />
                )}
                {viewer.isSuperadmin && (
                  <ActionRow
                    icon="manage_accounts"
                    title={isAdminTarget ? t("user.role.demoteAction") : t("user.role.promoteAction")}
                    description={isAdminTarget ? t("user.role.demoteSummary") : t("user.role.promoteSummary")}
                    button={
                      <Button variant="outline" className="h-10 px-4" onClick={openDialog("role")}>
                        {isAdminTarget ? t("user.role.demoteButton") : t("user.role.promoteButton")}
                      </Button>
                    }
                  />
                )}
              </ul>
            </Section>
          )}

          {viewer.isSuperadmin && canAct && (
            <section
              aria-labelledby="user-danger-title"
              className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-ambient ring-1 ring-red-600/30"
            >
              <h2 id="user-danger-title" className="font-headline text-base font-bold text-red-800">
                {t("common.dangerZone")}
              </h2>
              <DeletionPreview plan={data.deletion} />
              <Button className="h-10 w-full bg-red-700 px-4 font-semibold text-white hover:bg-red-800" onClick={openDialog("delete")}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  delete_forever
                </span>
                {t("user.delete.action")}
              </Button>
            </section>
          )}
        </div>
      </div>

      {canAct && (
        <>
          {resetDelivery !== "unavailable" && (
            <ConfirmDialog
              {...dialogProps("reset")}
              title={t("user.reset.title", { name: user.name })}
              description={
                resetDelivery === "shown"
                  ? t("user.reset.description", { email: user.email })
                  : t("user.reset.descriptionEmailed", { email: user.email })
              }
              confirmLabel={resetDelivery === "shown" ? t("user.reset.confirm") : t("user.reset.confirmEmailed")}
              onConfirm={createResetLink}
            >
              {resetDelivery === "shown" ? (
                <Callout tone="warning" icon="badge">
                  {t("user.reset.verifyIdentity")}
                </Callout>
              ) : (
                <Callout tone="info" icon="forward_to_inbox">
                  {t("user.reset.emailOnlyNote")}
                </Callout>
              )}
            </ConfirmDialog>
          )}

          <ConfirmDialog
            {...dialogProps("signout")}
            title={t("user.signout.title", { name: user.name })}
            description={t("user.signout.description")}
            confirmLabel={t("user.signout.confirm")}
            onConfirm={signOut}
          />

          <GuardedConfirmDialog
            {...dialogProps("mfa")}
            title={t("user.mfa.title", { name: user.name })}
            description={t("user.mfa.description")}
            tone="danger"
            checks={[t("user.mfa.check")]}
            confirmLabel={t("user.mfa.confirm")}
            onConfirm={resetMfa}
          >
            <Callout tone="warning" icon="gpp_maybe" title={t("user.mfa.warningTitle")}>
              {t("user.mfa.warningBody")}
            </Callout>
          </GuardedConfirmDialog>

          <ConfirmDialog
            {...dialogProps("disable")}
            title={t("user.disable.title", { name: user.name })}
            description={t("user.disable.description")}
            tone="danger"
            reason={{ required: true, label: t("user.disable.reasonLabel"), placeholder: t("user.disable.reasonPlaceholder") }}
            confirmLabel={t("user.disable.confirm")}
            onConfirm={disable}
          />

          <ConfirmDialog
            {...dialogProps("enable")}
            title={t("user.enable.title", { name: user.name })}
            description={t("user.enable.description")}
            confirmLabel={t("user.enable.confirm")}
            onConfirm={enable}
          />

          {viewer.isSuperadmin && (
            <ConfirmDialog
              {...dialogProps("role")}
              title={isAdminTarget ? t("user.role.demoteTitle", { name: user.name }) : t("user.role.promoteTitle", { name: user.name })}
              description={isAdminTarget ? t("user.role.demoteDescription") : t("user.role.promoteDescription")}
              tone={isAdminTarget ? "danger" : "default"}
              confirmLabel={isAdminTarget ? t("user.role.demoteConfirm") : t("user.role.promoteConfirm")}
              onConfirm={changeRole}
            >
              {!isAdminTarget && (
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-600/20">
                    <p className="font-semibold text-emerald-900">{t("user.role.canTitle")}</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-emerald-950/90">
                      <li>{t("user.role.can1")}</li>
                      <li>{t("user.role.can2")}</li>
                      <li>{t("user.role.can3")}</li>
                    </ul>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3 ring-1 ring-red-600/20">
                    <p className="font-semibold text-red-900">{t("user.role.cannotTitle")}</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-red-950/90">
                      <li>{t("user.role.cannot1")}</li>
                      <li>{t("user.role.cannot2")}</li>
                      <li>{t("user.role.cannot3")}</li>
                    </ul>
                  </div>
                </div>
              )}
            </ConfirmDialog>
          )}

          <PlanAssignDialog
            {...dialogProps("plan")}
            audience="INDIVIDUAL"
            current={data.plan}
            subjectName={user.name}
            onSubmit={savePlan}
          />

          {viewer.isSuperadmin && (
            <DeleteUserDialog {...dialogProps("delete")} user={user} initialPlan={data.deletion} onDeleted={deleted} />
          )}
        </>
      )}

      <OneTimeLinkDialog
        link={link}
        onClose={() => setLink(null)}
        title={t("user.reset.linkTitle")}
        description={t("user.reset.linkBody", { name: user.name })}
        fieldLabel={t("user.reset.linkLabel")}
        emailedTitle={t("user.reset.emailedTitle")}
      />
    </div>
  );
}
