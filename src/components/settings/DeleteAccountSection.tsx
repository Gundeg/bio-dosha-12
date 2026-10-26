"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/states";
import { Callout, ConfirmDialog, Section, useApiQuery } from "@/components/kit";
import { ApiError, apiFetch } from "@/lib/api";
import { formatNumber } from "@/lib/formatNumber";
import { Field, PasswordInput, QueryView, signOutTo } from "./shared";
import type { Me } from "./types";

/** GET /api/account (src/lib/accountLifecycle.ts#planAccountDeletion). */
interface DeletionPlan {
  blockers: { organizationId: string; organizationName: string }[];
  organizationsToDelete: { organizationId: string; organizationName: string; patientCount: number }[];
}

const DANGER_SECTION = "ring-red-600/25";

export function DeleteAccountSection({ me }: { me: Me }) {
  const t = useTranslations("settings.deleteAccount");

  if (me.isSuperadmin) {
    return (
      <Section title={t("title")} className={DANGER_SECTION}>
        <Callout tone="info" icon="shield_person" title={t("superadminTitle")}>
          {t("superadminBody")}
        </Callout>
      </Section>
    );
  }
  return <DeleteAccountBody />;
}

function DeleteAccountBody() {
  const t = useTranslations("settings.deleteAccount");
  const preview = useApiQuery<DeletionPlan>("/api/account");

  return (
    <Section title={t("title")} description={t("description")} className={DANGER_SECTION}>
      <QueryView
        query={preview}
        skeleton={
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-16" />
            <Skeleton className="h-10 w-48" />
          </div>
        }
      >
        {(plan) => <DeleteAccountContent plan={plan} reload={preview.reload} />}
      </QueryView>
    </Section>
  );
}

function DeleteAccountContent({ plan, reload }: { plan: DeletionPlan; reload: () => void }) {
  const t = useTranslations("settings.deleteAccount");
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [alsoOrganizations, setAlsoOrganizations] = useState(false);
  const blocked = plan.blockers.length > 0;
  const soleOrganizations = plan.organizationsToDelete;

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setPassword("");
      setAlsoOrganizations(false);
    }
  }

  async function confirmDelete() {
    // ConfirmDialog shows these messages in its error area.
    if (!password) throw new ApiError(400, t("passwordRequired"));
    if (soleOrganizations.length > 0 && !alsoOrganizations) throw new ApiError(400, t("organizationsRequired"));
    try {
      await apiFetch("/api/account", {
        method: "DELETE",
        body: JSON.stringify({
          password,
          confirm: "DELETE",
          deleteSoleOrganizations: soleOrganizations.length > 0 && alsoOrganizations,
        }),
      });
    } catch (err) {
      // Memberships may have changed since the preview was loaded.
      if (err instanceof ApiError && (err.code === "owner_required" || err.code === "confirm_organizations")) reload();
      throw err;
    }
    await signOutTo("/");
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-2 text-sm text-on-surface">
        {(["deletes1", "deletes2", "keeps"] as const).map((key) => (
          <li key={key} className="flex items-start gap-2">
            <span
              className={`material-symbols-outlined mt-px text-[18px] ${key === "keeps" ? "text-on-surface-variant" : "text-red-700"}`}
              aria-hidden="true"
            >
              {key === "keeps" ? "inventory_2" : "delete_forever"}
            </span>
            {t(key)}
          </li>
        ))}
      </ul>

      {blocked && (
        <Callout
          tone="warning"
          title={t("blockedTitle")}
          action={
            <ButtonLink href="/org?tab=members" variant="outline" className="h-10 bg-white px-4">
              {t("blockedAction")}
            </ButtonLink>
          }
        >
          <p>{t("blockedBody")}</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 font-medium">
            {plan.blockers.map((b) => (
              <li key={b.organizationId}>{b.organizationName}</li>
            ))}
          </ul>
          {plan.blockers.length > 1 && <p className="mt-2">{t("blockedSeveral")}</p>}
        </Callout>
      )}

      {!blocked && soleOrganizations.length > 0 && (
        <Callout tone="danger" title={t("soleTitle")}>
          <p>{t("soleBody")}</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {soleOrganizations.map((o) => (
              <li key={o.organizationId}>
                <span className="font-medium">{o.organizationName}</span>
                {" — "}
                {t("patients", { count: o.patientCount, formatted: formatNumber(o.patientCount) })}
              </li>
            ))}
          </ul>
        </Callout>
      )}

      <Button
        className="h-10 bg-red-700 px-5 font-semibold text-white hover:bg-red-800"
        disabled={blocked}
        onClick={() => changeOpen(true)}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          person_remove
        </span>
        {t("button")}
      </Button>
      {blocked && <p className="text-sm text-on-surface-variant">{t("blockedHint")}</p>}

      <ConfirmDialog
        open={open}
        onOpenChange={changeOpen}
        tone="danger"
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("confirm")}
        requireText={t("typedWord")}
        onConfirm={confirmDelete}
      >
        <Field id="delete-account-password" label={t("password")} required>
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        {soleOrganizations.length > 0 && (
          <label
            htmlFor="delete-account-organizations"
            className="flex cursor-pointer items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-950 ring-1 ring-red-600/20"
          >
            <input
              id="delete-account-organizations"
              type="checkbox"
              checked={alsoOrganizations}
              onChange={(e) => setAlsoOrganizations(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-red-700"
            />
            <span>
              {t("alsoOrganizations")}
              <span className="mt-1 block font-medium">
                {soleOrganizations.map((o) => o.organizationName).join(", ")}
              </span>
            </span>
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
}
