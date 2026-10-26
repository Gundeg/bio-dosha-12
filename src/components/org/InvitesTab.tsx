"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Callout,
  ConfirmDialog,
  CopyField,
  DataTable,
  FilterTabs,
  Section,
  StatusBadge,
  inviteStateTone,
  useErrorMessage,
  type Column,
} from "@/components/kit";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import { Field, FormMessage, TextInput, fieldErrorOf, looksLikeEmail } from "@/components/settings/shared";
import { CLINICAL_ROLES, type OrgRole } from "@/components/settings/types";
import { RolePicker } from "./RolePicker";
import { StepList } from "./StepList";
import { rolesNeedingOwner, seatsLeft, type CreatedInvite, type InviteState, type OrgDetail, type OrgInvite } from "./types";

type Filter = "all" | InviteState;
const FILTERS: Filter[] = ["all", "pending", "used", "revoked", "expired"];

export function InvitesTab({
  orgId,
  invites,
  detail,
  myRole,
  emailEnabled,
  onChanged,
}: {
  orgId: string;
  invites: OrgInvite[];
  detail: OrgDetail | null;
  myRole: OrgRole;
  emailEnabled: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations("org.invites");
  const tOrg = useTranslations("org");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState<OrgInvite | null>(null);
  const suspended = detail?.organization.status === "SUSPENDED";

  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? invites.length : invites.filter((i) => i.state === f).length])) as Record<Filter, number>;
  const rows = filter === "all" ? invites : invites.filter((i) => i.state === filter);

  async function revoke(invite: OrgInvite) {
    await apiFetch(`/api/org/${orgId}/invites/${invite.id}`, { method: "DELETE" });
    toast.success(t("revokedToast", { email: invite.email }));
    onChanged();
  }

  const columns: Column<OrgInvite>[] = [
    { key: "email", header: t("email"), primary: true, cell: (i) => <span className="font-semibold break-all text-on-surface">{i.email}</span> },
    { key: "role", header: t("role"), cell: (i) => (i.role ? tOrg(`roles.${i.role}.label`) : "—") },
    {
      key: "state",
      header: t("state"),
      cell: (i) => <StatusBadge tone={inviteStateTone(i.state)}>{t(`states.${i.state}`)}</StatusBadge>,
    },
    { key: "sent", header: t("sent"), cell: (i) => <span className="whitespace-nowrap tabular-nums">{formatDate(i.createdAt, locale)}</span> },
    {
      key: "expires",
      header: t("expires"),
      cell: (i) =>
        i.state === "pending" || i.state === "expired" ? (
          <span className="whitespace-nowrap tabular-nums">{formatDate(i.expiresAt, locale)}</span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("actions")}</span>,
      align: "right",
      cell: (i) =>
        i.state === "pending" ? (
          <Button
            variant="outline"
            className="h-10 px-3 text-red-700 hover:bg-red-50 hover:text-red-800"
            aria-label={t("revokeAria", { email: i.email })}
            onClick={() => {
              setRevoking(i);
              setRevokeOpen(true);
            }}
          >
            {t("revoke")}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {suspended ? (
        <Callout tone="danger" title={t("suspendedTitle")}>
          {t("suspendedBody")}
        </Callout>
      ) : (
        <InviteSection orgId={orgId} detail={detail} myRole={myRole} emailEnabled={emailEnabled} onCreated={onChanged} />
      )}

      <Section title={t("listTitle")} description={t("listDescription")}>
        {invites.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <FilterTabs
              label={t("filterLabel")}
              value={filter}
              onChange={setFilter}
              options={FILTERS.map((f) => ({ value: f, label: f === "all" ? t("filterAll") : t(`states.${f}`), count: counts[f] }))}
            />
          </div>
        )}
        <DataTable
          caption={t("listTitle")}
          columns={columns}
          rows={rows}
          rowKey={(i) => i.id}
          empty={invites.length === 0 ? t("empty") : t("emptyFilter")}
        />
      </Section>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        tone="danger"
        title={t("revokeTitle")}
        description={t("revokeBody", { email: revoking?.email ?? "" })}
        confirmLabel={t("revokeConfirm")}
        onConfirm={() => (revoking ? revoke(revoking) : undefined)}
      />
    </div>
  );
}

function InviteSection({
  orgId,
  detail,
  myRole,
  emailEnabled,
  onCreated,
}: {
  orgId: string;
  /** Plan and status; the seat note appears once it has loaded. */
  detail: OrgDetail | null;
  myRole: OrgRole;
  emailEnabled: boolean;
  onCreated: () => void;
}) {
  const t = useTranslations("org.invites");
  const tOrg = useTranslations("org");
  const locale = useLocale();
  const describe = useErrorMessage();
  // Only an owner can give access to patient records, so managers invite managers.
  const isOwner = myRole === "OWNER";
  const defaultRole: OrgRole = isOwner ? "PRACTITIONER" : "ADMIN";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>(defaultRole);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<(CreatedInvite & { email: string; role: OrgRole }) | null>(null);

  const limit = detail?.plan.limits.maxPractitioners;
  const seats = detail ? seatsLeft(detail) : null;
  const clinical = CLINICAL_ROLES.includes(role);
  const noSeat = clinical && seats === 0;
  const pendingOrg = detail?.organization.status === "PENDING";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    setFormError(null);
    if (!value) {
      setEmailError(t("emailRequired"));
      document.getElementById("invite-email")?.focus();
      return;
    }
    if (!looksLikeEmail(value)) {
      setEmailError(t("emailInvalid"));
      document.getElementById("invite-email")?.focus();
      return;
    }
    setEmailError(null);
    setBusy(true);
    try {
      const res = await apiFetch<CreatedInvite>(`/api/org/${orgId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: value, role }),
      });
      setCreated({ ...res, email: value.toLowerCase(), role });
      setEmail("");
      setRole(defaultRole);
      onCreated();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === "already_member") setEmailError(describe(err));
      else if (fieldErrorOf(err, "email")) setEmailError(t("emailInvalid"));
      else setFormError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <Section title={t("createdTitle")}>
        <div className="space-y-5" aria-live="polite">
          <Callout tone="success" title={t("createdFor", { email: created.email })}>
            {created.emailSent
              ? t("emailSent")
              : pendingOrg
                ? t("emailPending")
                : emailEnabled
                  ? t("emailFailed")
                  : t("emailOff")}
          </Callout>
          <CopyField
            label={t("linkLabel")}
            value={created.inviteUrl}
            note={t("linkNote", { date: formatDate(created.expiresAt, locale, "long") })}
          />
          <div>
            <h3 className="mb-3 font-headline text-sm font-bold text-on-surface">{t("nextTitle")}</h3>
            <StepList
              steps={[
                { title: t("next1Title"), body: t("next1Body") },
                { title: t("next2Title"), body: t("next2Body", { email: created.email }) },
                { title: t("next3Title"), body: t("next3Body") },
              ]}
            />
          </div>
          <Button variant="outline" className="h-10 px-4" onClick={() => setCreated(null)}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              person_add
            </span>
            {t("inviteAnother")}
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section title={t("formTitle")} description={t("formDescription")}>
      <form noValidate onSubmit={submit} className="space-y-5">
        {pendingOrg && (
          <Callout tone="info" icon="hourglass_top">
            {t("pendingNote")}
          </Callout>
        )}
        <Field id="invite-email" label={t("email")} required error={emailError} hint={t("emailHint")}>
          {(control) => (
            <TextInput
              {...control}
              type="email"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              value={email}
              maxLength={200}
              disabled={busy}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              className="sm:max-w-md"
            />
          )}
        </Field>

        <RolePicker
          name="invite-role"
          legend={t("role")}
          value={role}
          onChange={setRole}
          disabled={busy}
          disabledRoles={rolesNeedingOwner(myRole, tOrg("clinicalOwnerOnly"))}
        />

        {!isOwner && (
          <p className="flex items-start gap-1.5 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined mt-px text-[18px]" aria-hidden="true">
              info
            </span>
            {t("managerHint")}
          </p>
        )}
        {isOwner && detail && limit !== null && limit !== undefined && (
          <p className="flex items-start gap-1.5 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined mt-px text-[18px]" aria-hidden="true">
              info
            </span>
            {t("seatsNote", { used: detail.usage.practitioners, limit })}
          </p>
        )}
        {noSeat && (
          <Callout tone="warning" title={t("noSeatTitle")}>
            {t("noSeatBody")}
          </Callout>
        )}

        {formError && <FormMessage>{formError}</FormMessage>}

        <Button type="submit" className="h-10 px-5 font-semibold" disabled={busy || noSeat}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            send
          </span>
          {busy ? t("creating") : t("create")}
        </Button>
      </form>
    </Section>
  );
}
