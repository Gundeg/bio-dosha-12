"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Callout,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  PageHeader,
  Section,
  StatusBadge,
  useApiQuery,
  type Column,
} from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { formatNumber } from "@/lib/formatNumber";
import { ActivityList } from "./ActivityList";
import { LoadFailure, PageSkeleton, StaleNotice } from "./AdminStates";
import { useAdminViewer } from "./AdminViewer";
import { DateText, InviteStateBadge, MfaBadge, OrgStatusBadge } from "./badges";
import { GuardedConfirmDialog } from "./GuardedConfirmDialog";
import { useAdminLabels } from "./hooks";
import { InviteActions, InviteLinkDialog, InviteLinkNotice } from "./InviteActions";
import type { OneTimeLink } from "./OneTimeLinkDialog";
import { OrganizationEditDialog } from "./OrganizationEditDialog";
import { PlanAssignDialog, type PlanAssignment } from "./PlanAssignDialog";
import { UsageMeter } from "./PlanUsage";
import {
  hasPdfReports,
  limitOf,
  type ActivityItem,
  type EffectivePlanInfo,
  type InviteState,
  type MemberStatus,
  type OrgRole,
  type OrgStatus,
} from "./lib";
import { Icon } from "@/components/ui/icon";

/** GET /api/admin/organizations/[orgId] */
interface OrgDetailResponse {
  organization: {
    id: string;
    name: string;
    type: string;
    registrationNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    status: OrgStatus;
    createdAt: string;
    verifiedAt: string | null;
    verifiedBy: { name: string; email: string } | null;
    suspendedAt: string | null;
    suspendedReason: string | null;
  };
  members: {
    id: string;
    role: OrgRole;
    status: MemberStatus;
    title: string | null;
    joinedAt: string;
    user: { id: string; name: string; email: string; mfaEnabled: boolean; lastLoginAt: string | null; disabled: boolean };
  }[];
  invites: { id: string; email: string; role: OrgRole | null; state: InviteState; expiresAt: string; createdAt: string }[];
  plan: EffectivePlanInfo;
  usage: { practitioners: number; patients: number; intakes: number };
  recentActivity: ActivityItem[];
}

type Member = OrgDetailResponse["members"][number];
type Invite = OrgDetailResponse["invites"][number];
type DialogName = "verify" | "suspend" | "reactivate" | "edit" | "plan" | "delete";

export function OrganizationDetail({ orgId }: { orgId: string }) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const viewer = useAdminViewer();
  const labels = useAdminLabels();
  const router = useRouter();
  const url = `/api/admin/organizations/${encodeURIComponent(orgId)}`;
  const { data, error, reload } = useApiQuery<OrgDetailResponse>(url);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [link, setLink] = useState<OneTimeLink | null>(null);

  const backHref = "/admin/organizations";
  const backLabel = t("org.back");

  if (!data) {
    if (error) {
      return (
        <div>
          <PageHeader backHref={backHref} backLabel={backLabel} title={t("org.titleFallback")} />
          <LoadFailure error={error} onRetry={reload} backHref={backHref} backLabel={backLabel} notFoundTitle={t("org.notFound")} />
        </div>
      );
    }
    return <PageSkeleton sections={3} />;
  }

  const org = data.organization;
  const owner = data.members.find((m) => m.role === "OWNER" && m.status === "ACTIVE") ?? data.members.find((m) => m.role === "OWNER");
  const openDialog = (name: DialogName) => () => setDialog(name);
  const dialogProps = (name: DialogName) => ({
    open: dialog === name,
    onOpenChange: (open: boolean) => setDialog(open ? name : null),
  });

  async function patch(body: Record<string, unknown>) {
    await apiFetch(url, { method: "PATCH", body: JSON.stringify(body) });
  }
  async function verify() {
    await patch({ action: "verify" });
    toast.success(t("org.verify.done", { name: org.name }));
    reload();
  }
  async function suspend({ reason }: { reason: string }) {
    await patch({ action: "suspend", reason });
    toast.success(t("org.suspend.done", { name: org.name }));
    reload();
  }
  async function reactivate() {
    await patch({ action: "reactivate" });
    toast.success(t("org.reactivate.done", { name: org.name }));
    reload();
  }
  async function saveProfile(fields: Record<string, string>) {
    await patch({ action: "update", fields });
    toast.success(t("org.edit.saved"));
    reload();
  }
  async function savePlan(assignment: PlanAssignment) {
    await patch({ action: "set_plan", ...assignment });
    toast.success(assignment.planCode ? t("planAssign.saved") : t("planAssign.removed"));
    reload();
  }
  async function remove() {
    await apiFetch(url, { method: "DELETE", body: JSON.stringify({ confirmName: org.name.trim() }) });
    toast.success(t("org.delete.done", { name: org.name }));
    router.push(backHref);
  }

  const statusActions = (
    <>
      {org.status === "PENDING" && (
        <Button size="lg" onClick={openDialog("verify")}>
          <Icon name="verified" className="size-4" />
          {t("org.verify.action")}
        </Button>
      )}
      {org.status === "SUSPENDED" && (
        <Button size="lg" onClick={openDialog("reactivate")}>
          <Icon name="restart_alt" className="size-4" />
          {t("org.reactivate.action")}
        </Button>
      )}
      {org.status !== "SUSPENDED" && (
        <Button
          variant="destructive"
          size="lg"
          onClick={openDialog("suspend")}
        >
          <Icon name="block" className="size-4" />
          {t("org.suspend.action")}
        </Button>
      )}
    </>
  );

  const memberColumns: Column<Member>[] = [
    {
      key: "name",
      header: t("org.members.columns.name"),
      primary: true,
      cell: (m) => (
        <span className="block">
          <span className="block">{m.user.name}</span>
          {m.title && <span className="block text-xs font-normal text-on-surface-variant">{m.title}</span>}
        </span>
      ),
    },
    { key: "email", header: t("org.members.columns.email"), cell: (m) => <span className="break-all">{m.user.email}</span> },
    {
      key: "role",
      header: t("org.members.columns.role"),
      cell: (m) => <StatusBadge tone={m.role === "OWNER" ? "primary" : "neutral"} dot={false}>{labels.orgRole(m.role)}</StatusBadge>,
    },
    {
      key: "status",
      header: t("org.members.columns.status"),
      cell: (m) =>
        m.status === "DISABLED" ? (
          <StatusBadge tone="danger">{t("org.members.disabledHere")}</StatusBadge>
        ) : m.user.disabled ? (
          <StatusBadge tone="danger">{t("org.members.accountDisabled")}</StatusBadge>
        ) : (
          <StatusBadge tone="success">{labels.memberStatus("ACTIVE")}</StatusBadge>
        ),
    },
    { key: "mfa", header: t("org.members.columns.mfa"), cell: (m) => <MfaBadge enabled={m.user.mfaEnabled} required /> },
    {
      key: "lastLogin",
      header: t("org.members.columns.lastLogin"),
      cell: (m) => <DateText value={m.user.lastLoginAt} withTime emptyLabel={tk("never")} />,
    },
  ];

  const inviteColumns: Column<Invite>[] = [
    { key: "email", header: t("org.invites.columns.email"), primary: true, cell: (i) => <span className="break-all">{i.email}</span> },
    { key: "role", header: t("org.invites.columns.role"), cell: (i) => labels.orgRole(i.role) },
    { key: "state", header: t("org.invites.columns.state"), cell: (i) => <InviteStateBadge state={i.state} /> },
    {
      key: "expires",
      header: t("org.invites.columns.expires"),
      cell: (i) => (i.state === "pending" ? <DateText value={i.expiresAt} withTime /> : <span className="text-on-surface-variant">—</span>),
    },
    { key: "created", header: t("org.invites.columns.created"), cell: (i) => <DateText value={i.createdAt} />, hideOnMobile: true },
    {
      key: "actions",
      header: <span className="sr-only">{t("org.invites.columns.actions")}</span>,
      align: "right",
      cell: (i) => <InviteActions invite={i} onChanged={reload} onLinkCreated={setLink} />,
    },
  ];

  const practitionerLimit = limitOf(data.plan.limits, "maxPractitioners");
  const patientLimit = limitOf(data.plan.limits, "maxPatients");

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={backHref}
        backLabel={backLabel}
        eyebrow={[labels.orgType(org.type), org.city].filter(Boolean).join(" · ")}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="break-words">{org.name}</span>
            <OrgStatusBadge status={org.status} />
          </span>
        }
        description={t("org.registeredOn", { date: labels.date(org.createdAt) ?? "" })}
        actions={statusActions}
      />

      <StaleNotice error={error} onRetry={reload} />

      {org.status === "PENDING" && (
        <Callout tone="warning" icon="pending_actions" title={t("org.pendingCallout.title")}>
          {t("org.pendingCallout.body")}
        </Callout>
      )}
      {org.status === "SUSPENDED" && (
        <Callout
          tone="danger"
          icon="block"
          title={t("org.suspendedCallout.title", { date: labels.date(org.suspendedAt) ?? "—" })}
        >
          <p>{t("org.suspendedCallout.reason", { reason: org.suspendedReason ?? "—" })}</p>
          <p className="mt-1">{t("org.suspendedCallout.body")}</p>
        </Callout>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          id="org-profile"
          className="lg:col-span-2"
          title={t("org.profile.title")}
          actions={
            <Button variant="outline" size="lg" onClick={openDialog("edit")}>
              <Icon name="edit" className="size-4" />
              {t("org.profile.edit")}
            </Button>
          }
        >
          <DescriptionList
            items={[
              { label: t("orgForm.name"), value: org.name },
              { label: t("orgForm.type"), value: labels.orgType(org.type) },
              { label: t("orgForm.registrationNumber"), value: org.registrationNumber ?? "—" },
              { label: t("orgForm.phone"), value: org.phone ?? "—" },
              { label: t("orgForm.email"), value: org.email ?? "—" },
              { label: t("orgForm.city"), value: org.city ?? "—" },
              { label: t("orgForm.address"), value: org.address ?? "—" },
              { label: t("org.profile.registered"), value: <DateText value={org.createdAt} withTime /> },
              {
                label: t("org.profile.verified"),
                value: org.verifiedAt ? (
                  <>
                    <DateText value={org.verifiedAt} withTime />
                    {org.verifiedBy && (
                      <span className="block text-xs text-on-surface-variant">
                        {t("org.profile.verifiedBy", { name: org.verifiedBy.name, email: org.verifiedBy.email })}
                      </span>
                    )}
                  </>
                ) : (
                  t("org.profile.notVerified")
                ),
              },
            ]}
          />
        </Section>

        <Section
          id="org-plan"
          title={t("org.plan.title")}
          actions={
            <Button variant="outline" size="lg" onClick={openDialog("plan")}>
              {t("org.plan.change")}
            </Button>
          }
          bodyClassName="space-y-4"
        >
          <div>
            <p className="text-lg font-semibold text-on-surface">{labels.planName(data.plan)}</p>
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
          <UsageMeter label={t("limits.maxPractitioners")} used={data.usage.practitioners} limit={practitionerLimit} />
          <UsageMeter label={t("limits.maxPatients")} used={data.usage.patients} limit={patientLimit} />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-on-surface">{t("limits.pdfReports")}</span>
            {hasPdfReports(data.plan.limits) ? (
              <StatusBadge tone="success" icon="check">
                {t("common.included")}
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral" icon="close">
                {t("common.notIncluded")}
              </StatusBadge>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-3 text-sm">
            <span className="text-on-surface-variant">{t("org.plan.intakes")}</span>
            <span className="font-semibold tabular-nums text-on-surface">{formatNumber(data.usage.intakes)}</span>
          </div>
          <p className="text-xs text-on-surface-variant">{t("org.plan.countsOnly")}</p>
        </Section>
      </div>

      <Section
        id="org-members"
        title={t("org.members.title")}
        description={t("org.members.summary", { count: data.members.length, clinical: data.usage.practitioners })}
      >
        <DataTable
          caption={t("org.members.title")}
          columns={memberColumns}
          rows={data.members}
          rowKey={(m) => m.id}
          rowHref={(m) => `/admin/users/${m.user.id}`}
          empty={t("org.members.empty")}
        />
      </Section>

      <Section id="org-invites" title={t("org.invites.title")} description={t("org.invites.description")} bodyClassName="space-y-4">
        {data.invites.some((i) => i.state !== "used") && <InviteLinkNotice />}
        <DataTable
          caption={t("org.invites.title")}
          columns={inviteColumns}
          rows={data.invites}
          rowKey={(i) => i.id}
          empty={t("org.invites.empty")}
        />
      </Section>

      {viewer.isSuperadmin && (
        <Section
          id="org-activity"
          title={t("org.activity.title")}
          description={t("org.activity.description")}
          actions={
            <ButtonLink href={`/admin/audit?organizationId=${encodeURIComponent(org.id)}`} variant="link" className="px-2">
              {t("common.openAudit")}
            </ButtonLink>
          }
        >
          <ActivityList items={data.recentActivity} empty={t("org.activity.empty")} />
        </Section>
      )}

      {viewer.isSuperadmin && (
        <section
          aria-labelledby="org-danger-title"
          className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
        >
          <h2 id="org-danger-title" className="text-base font-semibold text-red-800">
            {t("common.dangerZone")}
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-semibold text-on-surface">{t("org.delete.action")}</p>
              <p className="mt-0.5 text-on-surface-variant">
                {t("org.delete.summary", { patients: data.usage.patients, intakes: data.usage.intakes })}
              </p>
            </div>
            <Button variant="destructive" size="lg" className="shrink-0" onClick={openDialog("delete")}>
              <Icon name="delete_forever" className="size-4" />
              {t("org.delete.action")}
            </Button>
          </div>
        </section>
      )}

      <GuardedConfirmDialog
        {...dialogProps("verify")}
        title={t("org.verify.title", { name: org.name })}
        description={t("org.verify.description")}
        checksLabel={t("org.verify.checklist")}
        checks={[
          org.registrationNumber
            ? t("org.verify.checkRegistry", { number: org.registrationNumber })
            : t("org.verify.checkRegistryMissing"),
          org.phone ? t("org.verify.checkPhone", { phone: org.phone }) : t("org.verify.checkPhoneMissing"),
          owner
            ? t("org.verify.checkOwner", { name: owner.user.name, email: owner.user.email })
            : t("org.verify.checkOwnerMissing"),
        ]}
        confirmLabel={t("org.verify.confirm")}
        onConfirm={verify}
      >
        <Callout tone="info" icon="lock_open">
          {t("org.verify.unlocks")}
        </Callout>
      </GuardedConfirmDialog>

      <ConfirmDialog
        {...dialogProps("suspend")}
        title={t("org.suspend.title", { name: org.name })}
        description={t("org.suspend.description")}
        tone="danger"
        reason={{ required: true, label: t("org.suspend.reasonLabel"), placeholder: t("org.suspend.reasonPlaceholder") }}
        confirmLabel={t("org.suspend.confirm")}
        onConfirm={suspend}
      />

      <ConfirmDialog
        {...dialogProps("reactivate")}
        title={t("org.reactivate.title", { name: org.name })}
        description={org.verifiedAt ? t("org.reactivate.description") : t("org.reactivate.descriptionUnverified")}
        confirmLabel={t("org.reactivate.confirm")}
        onConfirm={reactivate}
      />

      <ConfirmDialog
        {...dialogProps("delete")}
        title={t("org.delete.title", { name: org.name })}
        description={t("org.delete.description", {
          members: data.members.length,
          patients: data.usage.patients,
          intakes: data.usage.intakes,
        })}
        tone="danger"
        requireText={org.name.trim()}
        confirmLabel={t("org.delete.confirm")}
        onConfirm={remove}
      >
        <Callout tone="danger" icon="warning">
          {t("org.delete.irreversible")}
        </Callout>
      </ConfirmDialog>

      <OrganizationEditDialog {...dialogProps("edit")} profile={org} onSave={saveProfile} />

      <PlanAssignDialog
        {...dialogProps("plan")}
        audience="ORGANIZATION"
        current={data.plan}
        subjectName={org.name}
        onSubmit={savePlan}
      />

      <InviteLinkDialog link={link} onClose={() => setLink(null)} />
    </div>
  );
}
