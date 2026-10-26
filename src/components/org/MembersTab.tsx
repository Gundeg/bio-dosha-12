"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Callout, ConfirmDialog, DataTable, Section, StatusBadge, accountStatusTone, type Column } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/formatDate";
import type { OrgRole } from "@/components/settings/types";
import { ManageMemberDialog } from "./ManageMemberDialog";
import type { OrgDetail, OrgMember } from "./types";

type DialogKind = "manage" | "disable" | "remove" | "leave";

export function MembersTab({
  orgId,
  organizationName,
  members,
  detail,
  myRole,
  canManage,
  onChanged,
}: {
  orgId: string;
  organizationName: string;
  members: OrgMember[];
  /** Organization detail when loaded (status, plan seats). */
  detail: OrgDetail | null;
  myRole: OrgRole;
  canManage: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations("org.members");
  const tOrg = useTranslations("org");
  const tKit = useTranslations("kit");
  const locale = useLocale();
  const router = useRouter();
  const { update } = useSession();
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  // Kept after a dialog closes so its text does not change during the closing animation.
  const [target, setTarget] = useState<OrgMember | null>(null);
  // A fresh manage form every time it opens.
  const [openCount, setOpenCount] = useState(0);

  const suspended = detail?.organization.status === "SUSPENDED";
  const canEdit = canManage && !suspended;
  const activeOwners = members.filter((m) => m.role === "OWNER" && m.status === "ACTIVE").length;
  const me = members.find((m) => m.isMe) ?? null;
  const lastOwner = me?.role === "OWNER" && me.status === "ACTIVE" && activeOwners <= 1;
  const without2Step = members.filter((m) => m.status === "ACTIVE" && !m.mfaEnabled).length;

  function open(kind: DialogKind, member: OrgMember) {
    setTarget(member);
    setDialog(kind);
    setOpenCount((n) => n + 1);
  }
  const close = () => setDialog(null);

  async function setStatus(member: OrgMember, status: "ACTIVE" | "DISABLED") {
    await apiFetch(`/api/org/${orgId}/members/${member.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    toast.success(status === "DISABLED" ? t("disabledToast", { name: member.name }) : t("enabledToast", { name: member.name }));
    onChanged();
  }

  async function remove(member: OrgMember) {
    await apiFetch(`/api/org/${orgId}/members/${member.id}`, { method: "DELETE" });
    toast.success(t("removedToast", { name: member.name }));
    onChanged();
  }

  async function leave(member: OrgMember) {
    await apiFetch(`/api/org/${orgId}/members/${member.id}`, { method: "DELETE" });
    toast.success(t("leftToast", { organization: organizationName }));
    await update({}); // {} forces a claim refresh (see src/components/auth/session.ts)
    router.replace("/dashboard");
  }

  function actionFor(m: OrgMember) {
    if (m.isMe && !canEdit) {
      return (
        <Button
          variant="outline"
          className="h-10 px-3 text-red-700 hover:bg-red-50 hover:text-red-800"
          disabled={lastOwner}
          onClick={() => open("leave", m)}
        >
          {t("leave")}
        </Button>
      );
    }
    if (!canEdit) return null;
    return (
      <Button
        variant="outline"
        className="h-10 px-3"
        aria-label={m.isMe ? undefined : t("manageAria", { name: m.name })}
        onClick={() => open("manage", m)}
      >
        {t("manage")}
      </Button>
    );
  }

  const columns: Column<OrgMember>[] = [
    {
      key: "name",
      header: t("name"),
      primary: true,
      cell: (m) => (
        <span className="inline-flex flex-wrap items-center gap-2">
          <span className="font-semibold text-on-surface">{m.name}</span>
          {m.isMe && (
            <StatusBadge tone="primary" dot={false}>
              {t("you")}
            </StatusBadge>
          )}
        </span>
      ),
    },
    ...(canManage
      ? [{ key: "email", header: t("email"), cell: (m: OrgMember) => <span className="break-all">{m.email ?? "—"}</span> }]
      : []),
    { key: "role", header: t("role"), cell: (m) => tOrg(`roles.${m.role}.label`) },
    { key: "title", header: t("jobTitle"), cell: (m) => m.title || <span className="text-on-surface-variant">—</span> },
    {
      key: "mfa",
      header: t("twoStep"),
      cell: (m) =>
        m.mfaEnabled ? (
          <StatusBadge tone="success">{t("twoStepOn")}</StatusBadge>
        ) : (
          <StatusBadge tone="warning">{t("twoStepOff")}</StatusBadge>
        ),
    },
    ...(canManage
      ? [
          {
            key: "lastLogin",
            header: t("lastSignIn"),
            cell: (m: OrgMember) => (
              <span className="whitespace-nowrap tabular-nums">
                {m.lastLoginAt ? formatDateTime(m.lastLoginAt, locale) : tKit("never")}
              </span>
            ),
          },
        ]
      : []),
    {
      key: "status",
      header: t("status"),
      cell: (m) => (
        <StatusBadge tone={accountStatusTone(m.status === "DISABLED")}>{tOrg(`memberStatus.${m.status}`)}</StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("actions")}</span>,
      align: "right",
      cell: actionFor,
    },
  ];

  return (
    <div className="space-y-6">
      {suspended && canManage && (
        <Callout tone="danger" title={t("suspendedTitle")}>
          {t("suspendedBody")}
        </Callout>
      )}

      <Section
        title={t("title")}
        description={t("count", { count: members.length })}
        actions={
          canEdit ? (
            <ButtonLink href="/org?tab=invites" className="h-10 px-4 font-semibold">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                person_add
              </span>
              {t("invite")}
            </ButtonLink>
          ) : undefined
        }
      >
        {canManage && without2Step > 0 && (
          <Callout tone="info" icon="phonelink_lock" className="mb-4">
            {t("twoStepPending", { count: without2Step })}
          </Callout>
        )}
        <DataTable caption={t("caption")} columns={columns} rows={members} rowKey={(m) => m.id} empty={t("empty")} />
        {!canManage && <p className="mt-4 text-sm text-on-surface-variant">{t("readOnlyNote")}</p>}
        {lastOwner && !canEdit && <p className="mt-2 text-sm text-on-surface-variant">{t("lastOwnerNote")}</p>}
      </Section>

      {target && (
        <ManageMemberDialog
          key={openCount}
          open={dialog === "manage"}
          orgId={orgId}
          member={target}
          myRole={myRole}
          detail={detail}
          lastOwner={target.isMe && lastOwner}
          onClose={close}
          onChanged={onChanged}
          onEnable={() => setStatus(target, "ACTIVE")}
          onRequest={(kind) => setDialog(kind)}
        />
      )}

      <ConfirmDialog
        open={dialog === "disable"}
        onOpenChange={(isOpen) => !isOpen && close()}
        tone="danger"
        title={t("disableTitle", { name: target?.name ?? "" })}
        description={t("disableBody")}
        confirmLabel={t("disableConfirm")}
        onConfirm={() => (target ? setStatus(target, "DISABLED") : undefined)}
      />
      <ConfirmDialog
        open={dialog === "remove"}
        onOpenChange={(isOpen) => !isOpen && close()}
        tone="danger"
        title={t("removeTitle", { name: target?.name ?? "" })}
        description={t("removeBody")}
        confirmLabel={t("removeConfirm")}
        onConfirm={() => (target ? remove(target) : undefined)}
      />
      <ConfirmDialog
        open={dialog === "leave"}
        onOpenChange={(isOpen) => !isOpen && close()}
        tone="danger"
        title={t("leaveTitle", { organization: organizationName })}
        description={t("leaveBody")}
        confirmLabel={t("leaveConfirm")}
        onConfirm={() => (target ? leave(target) : undefined)}
      />
    </div>
  );
}
