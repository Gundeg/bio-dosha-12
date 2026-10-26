"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Callout, DescriptionList, useErrorMessage } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { Field, FormDialog, TextInput } from "@/components/settings/shared";
import { CLINICAL_ROLES, type OrgRole } from "@/components/settings/types";
import { RolePicker } from "./RolePicker";
import { canReenable, rolesNeedingOwner, seatsLeft, type OrgDetail, type OrgMember } from "./types";

const TITLE_MAX = 100;

/**
 * Change one member's role and job title, and reach the access actions
 * (turn off / on, remove). On the manager's own row only the job title can
 * change; nobody changes their own role or access (the API refuses it too).
 * Only an owner can give access to patient records: managers cannot choose
 * the owner or practitioner role, nor turn such a member's access back on.
 */
export function ManageMemberDialog({
  open,
  orgId,
  member,
  myRole,
  detail,
  lastOwner,
  onClose,
  onChanged,
  onEnable,
  onRequest,
}: {
  open: boolean;
  orgId: string;
  member: OrgMember;
  myRole: OrgRole;
  detail: OrgDetail | null;
  /** This is my row and I am the only active owner. */
  lastOwner: boolean;
  onClose: () => void;
  onChanged: () => void;
  onEnable: () => Promise<void>;
  onRequest: (kind: "disable" | "remove" | "leave") => void;
}) {
  const t = useTranslations("org.manage");
  const tOrg = useTranslations("org");
  const tRoles = useTranslations("org.roles");
  const tKit = useTranslations("kit");
  const locale = useLocale();
  const describe = useErrorMessage();
  const [role, setRole] = useState<OrgRole>(member.role);
  const [title, setTitle] = useState(member.title ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const self = member.isMe;
  // Only an owner may grant, change or remove the owner role.
  const canTouch = !self && (member.role !== "OWNER" || myRole === "OWNER");
  const seats = detail ? seatsLeft(detail) : null;
  const noSeat = seats === 0;

  const roleChanged = canTouch && role !== member.role;
  const titleChanged = title.trim() !== (member.title ?? "");
  const becomesClinical = roleChanged && member.role === "ADMIN" && CLINICAL_ROLES.includes(role);
  const blockedBySeats = becomesClinical && noSeat;
  const enableBlockedByRole = member.status === "DISABLED" && !canReenable(myRole, member);
  const enableBlockedBySeats = member.status === "DISABLED" && member.role !== "ADMIN" && noSeat;

  async function save() {
    if (!roleChanged && !titleChanged) {
      onClose();
      return;
    }
    const body: { role?: OrgRole; title?: string | null } = {};
    if (roleChanged) body.role = role;
    if (titleChanged) body.title = title.trim() || null;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/org/${orgId}/members/${member.id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success(t("saved", { name: member.name }));
      onChanged();
      setBusy(false);
      onClose();
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      await onEnable();
      setBusy(false);
      onClose();
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }

  function consequence(): string | null {
    if (!roleChanged) return null;
    if (role === "ADMIN") return t("toManager", { name: member.name });
    if (member.role === "ADMIN") return t("toClinical", { name: member.name });
    if (role === "OWNER") return t("toOwner", { name: member.name });
    return t("fromOwner", { name: member.name });
  }
  const note = consequence();

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={self ? t("selfTitle") : t("title", { name: member.name })}
      description={self ? t("selfDescription") : undefined}
      submitLabel={t("save")}
      busy={busy}
      error={error}
      submitDisabled={blockedBySeats || (!roleChanged && !titleChanged)}
      onSubmit={save}
      className="sm:max-w-lg"
    >
      <div className="rounded-xl bg-surface-container-low p-4">
        <DescriptionList
          items={[
            { label: t("email"), value: <span className="break-all">{member.email ?? "—"}</span> },
            { label: t("joined"), value: formatDate(member.joinedAt, locale, "long") },
            { label: t("twoStep"), value: member.mfaEnabled ? t("twoStepOn") : t("twoStepOff") },
            {
              label: t("lastSignIn"),
              value: member.lastLoginAt ? formatDateTime(member.lastLoginAt, locale) : tKit("never"),
            },
          ]}
        />
      </div>

      {canTouch ? (
        <RolePicker
          name={`member-role-${member.id}`}
          legend={t("role")}
          value={role}
          onChange={setRole}
          disabled={busy}
          disabledRoles={rolesNeedingOwner(myRole, tOrg("clinicalOwnerOnly"), member.role)}
        />
      ) : (
        <div className="text-sm">
          <p className="font-medium text-on-surface">{t("role")}</p>
          <p className="mt-1 font-semibold text-on-surface">{tRoles(`${member.role}.label`)}</p>
          <p className="text-on-surface-variant">{tRoles(`${member.role}.description`)}</p>
          <p className="mt-2 text-xs text-on-surface-variant">{self ? t("selfRoleNote") : t("ownerRoleNote")}</p>
        </div>
      )}

      {note && (
        <p role="status" className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-950 ring-1 ring-sky-600/20">
          {note}
        </p>
      )}
      {blockedBySeats && (
        <Callout tone="warning" title={t("noSeatTitle")}>
          {t("noSeatBody", { limit: detail?.plan.limits.maxPractitioners ?? 0 })}
        </Callout>
      )}

      <Field id={`member-title-${member.id}`} label={t("jobTitle")} hint={t("jobTitleHint")}>
        {(control) => (
          <TextInput
            {...control}
            value={title}
            maxLength={TITLE_MAX}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}
      </Field>

      <div className="space-y-3 border-t border-outline-variant/20 pt-4">
        <p className="text-sm font-semibold text-on-surface">{t("accessTitle")}</p>
        {self ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 text-red-700 hover:bg-red-50 hover:text-red-800"
              disabled={busy || lastOwner}
              onClick={() => onRequest("leave")}
            >
              {t("leave")}
            </Button>
            <p className="text-xs text-on-surface-variant">{lastOwner ? t("lastOwnerNote") : t("leaveHint")}</p>
          </>
        ) : canTouch ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {member.status === "ACTIVE" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4 text-red-700 hover:bg-red-50 hover:text-red-800"
                  disabled={busy}
                  onClick={() => onRequest("disable")}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    block
                  </span>
                  {t("disable")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4"
                  disabled={busy || enableBlockedByRole || enableBlockedBySeats}
                  onClick={enable}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    check_circle
                  </span>
                  {t("enable")}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-4 text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={busy}
                onClick={() => onRequest("remove")}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  person_remove
                </span>
                {t("remove")}
              </Button>
            </div>
            <p className="text-xs text-on-surface-variant">
              {member.status === "ACTIVE"
                ? t("disableHint")
                : enableBlockedByRole
                  ? tOrg("clinicalOwnerOnly")
                  : enableBlockedBySeats
                    ? t("enableNoSeat")
                    : t("enableHint")}
            </p>
          </>
        ) : (
          <p className="text-xs text-on-surface-variant">{t("ownerAccessNote")}</p>
        )}
      </div>
    </FormDialog>
  );
}
