"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Callout } from "@/components/kit";
import { ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/formatNumber";
import { CheckboxField } from "./fields";
import { GuardedConfirmDialog } from "./GuardedConfirmDialog";
import type { DeletionPlan } from "./lib";

/**
 * What deleting an account takes with it, from planAccountDeletion: blockers
 * (organizations that would lose their only owner) and organizations where
 * the person is the only member (deleted only with explicit consent).
 */
export function DeletionPreview({ plan }: { plan: DeletionPlan }) {
  const t = useTranslations("admin");
  return (
    <div className="space-y-3">
      {plan.blockers.length > 0 && (
        <Callout tone="danger" icon="block" title={t("user.delete.blockedTitle")}>
          <p>{t("user.delete.blockedBody")}</p>
          <ul className="mt-1 list-disc pl-5">
            {plan.blockers.map((b) => (
              <li key={b.organizationId}>{b.organizationName}</li>
            ))}
          </ul>
        </Callout>
      )}
      {plan.organizationsToDelete.length > 0 && (
        <Callout tone="warning" icon="domain_disabled" title={t("user.delete.soleTitle")}>
          <p>{t("user.delete.soleBody")}</p>
          <ul className="mt-1 list-disc pl-5">
            {plan.organizationsToDelete.map((o) => (
              <li key={o.organizationId}>
                {t("user.delete.soleItem", { name: o.organizationName, count: o.patientCount, value: formatNumber(o.patientCount) })}
              </li>
            ))}
          </ul>
        </Callout>
      )}
      {plan.blockers.length === 0 && plan.organizationsToDelete.length === 0 && (
        <p className="text-sm text-on-surface-variant">{t("user.delete.clean")}</p>
      )}
    </div>
  );
}

/**
 * Permanent deletion (superadmin). The email must be typed; organizations
 * where the person is the only member need an extra tick. A 409 answer carries
 * the current deletion plan, which replaces the preview from page load.
 */
export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  initialPlan,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string; email: string };
  initialPlan: DeletionPlan;
  onDeleted: () => void;
}) {
  const t = useTranslations("admin");
  const [plan, setPlan] = useState(initialPlan);
  const [alsoOrganizations, setAlsoOrganizations] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPlan(initialPlan);
      setAlsoOrganizations(false);
    }
  }

  const blocked = plan.blockers.length > 0;
  const needsConsent = plan.organizationsToDelete.length > 0;

  async function remove() {
    let res: Response;
    try {
      res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: user.email, deleteSoleOrganizations: needsConsent && alsoOrganizations }),
      });
    } catch {
      throw new ApiError(0, "");
    }
    const body = (await res.json().catch(() => null)) as {
      error?: unknown;
      code?: unknown;
      plan?: DeletionPlan;
      fieldErrors?: Record<string, string[]>;
    } | null;
    if (!res.ok) {
      // The deletion plan may have changed since the page loaded: show the current one.
      if (res.status === 409 && body?.plan) {
        setPlan(body.plan);
        setAlsoOrganizations(false);
      }
      throw new ApiError(
        res.status,
        typeof body?.error === "string" ? body.error : "",
        body?.fieldErrors,
        typeof body?.code === "string" ? body.code : undefined
      );
    }
    onDeleted();
  }

  return (
    <GuardedConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("user.delete.title", { name: user.name })}
      description={t("user.delete.description")}
      tone="danger"
      requireText={user.email}
      canConfirm={!blocked && (!needsConsent || alsoOrganizations)}
      confirmLabel={t("user.delete.confirm")}
      onConfirm={remove}
    >
      <DeletionPreview plan={plan} />
      {needsConsent && !blocked && (
        <CheckboxField
          className="rounded-lg bg-red-50 ring-1 ring-red-600/20 hover:bg-red-50"
          label={t("user.delete.alsoOrganizations")}
          description={t("user.delete.alsoOrganizationsHint")}
          checked={alsoOrganizations}
          onChange={setAlsoOrganizations}
        />
      )}
    </GuardedConfirmDialog>
  );
}
