"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { Callout, PageHeader, Section, StatusBadge, useApiQuery } from "@/components/kit";
import { formatMnt, formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { LoadFailure, PageSkeleton, StaleNotice } from "./AdminStates";
import { useAdminViewer } from "./AdminViewer";
import { useAdminLabels } from "./hooks";
import { hasPdfReports, limitOf, planOtherName, type AdminPlan, type PlanAudience } from "./lib";
import { PlanFormDialog } from "./PlanFormDialog";
import { AUDIENCE_LIMITS } from "./PlanUsage";
import { Icon } from "@/components/ui/icon";

function PlanCard({ plan, canEdit, onEdit }: { plan: AdminPlan; canEdit: boolean; onEdit: () => void }) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const labels = useAdminLabels();
  const price = formatMnt(plan.priceMonthlyMnt);
  const description = labels.locale === "en" ? plan.descriptionEn : plan.descriptionMn;

  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-ambient",
        !plan.isActive && "bg-surface-container-low/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`plan-${plan.id}`} className="text-lg font-semibold text-on-surface">
            {labels.planName(plan)}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {planOtherName(plan, labels.locale)} · <span className="font-mono">{plan.code}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {plan.isDefault && (
            <StatusBadge tone="primary" icon="star">
              {t("plans.default")}
            </StatusBadge>
          )}
          <StatusBadge tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? t("plans.active") : t("plans.inactive")}</StatusBadge>
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums text-on-surface">
        {price ? (
          <>
            {price}
            <span className="ml-1 text-sm font-medium text-on-surface-variant">{t("plans.perMonth")}</span>
          </>
        ) : (
          <span className="text-base">{t("plans.freeOrAgreement")}</span>
        )}
      </p>
      {description && <p className="mt-2 text-sm text-on-surface-variant">{description}</p>}

      <dl className="mt-4 space-y-1.5 border-t border-outline-variant/20 pt-3 text-sm">
        {AUDIENCE_LIMITS[plan.audience].map((key) => {
          const limit = limitOf(plan.limits, key);
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <dt className="text-on-surface-variant">{t(`limits.${key}`)}</dt>
              <dd className="font-semibold tabular-nums text-on-surface">{limit === null ? tk("unlimited") : formatNumber(limit)}</dd>
            </div>
          );
        })}
        {plan.audience === "ORGANIZATION" && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-on-surface-variant">{t("limits.pdfReports")}</dt>
            <dd className="font-semibold text-on-surface">{hasPdfReports(plan.limits) ? t("common.included") : t("common.notIncluded")}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-1 items-end justify-between gap-3 border-t border-outline-variant/20 pt-3">
        <p className="text-xs text-on-surface-variant">
          <span className="font-semibold tabular-nums text-on-surface">{t("plans.assignedCount", { count: plan.subscribers })}</span>
          {plan.isDefault && <span className="block">{t("plans.plusDefaultUsers")}</span>}
        </p>
        {canEdit && (
          <Button variant="outline" size="lg" className="shrink-0" onClick={onEdit}>
            <Icon name="edit" className="size-4" />
            {t("plans.edit")}
            <span className="sr-only">: {labels.planName(plan)}</span>
          </Button>
        )}
      </div>
    </article>
  );
}

export function PlansOverview() {
  const t = useTranslations("admin");
  const labels = useAdminLabels();
  const viewer = useAdminViewer();
  const { data, error, reload } = useApiQuery<AdminPlan[]>("/api/admin/plans");
  const [dialog, setDialog] = useState<{ plan: AdminPlan | null } | null>(null);
  const [lastPlan, setLastPlan] = useState<AdminPlan | null>(null);

  const header = (
    <PageHeader
      title={t("plans.title")}
      description={t("plans.description")}
      actions={
        viewer.isSuperadmin ? (
          <Button
            size="lg"
            onClick={() => {
              setLastPlan(null);
              setDialog({ plan: null });
            }}
          >
            <Icon name="add" className="size-4" />
            {t("plans.new")}
          </Button>
        ) : undefined
      }
    />
  );

  if (!data) {
    if (error) {
      return (
        <div>
          {header}
          <LoadFailure error={error} onRetry={reload} />
        </div>
      );
    }
    return <PageSkeleton sections={2} />;
  }

  function saved(message: string) {
    toast.success(message);
    reload();
  }

  const groups: PlanAudience[] = ["INDIVIDUAL", "ORGANIZATION"];

  return (
    <div className="space-y-6">
      {header}
      <StaleNotice error={error} onRetry={reload} />

      <Callout tone="info" icon="info" title={t("plans.howTitle")}>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>{t("plans.how1")}</li>
          <li>{t("plans.how2")}</li>
          <li>{t("plans.how3")}</li>
          <li>{t("plans.how4")}</li>
        </ul>
      </Callout>
      {!viewer.isSuperadmin && (
        <Callout tone="info" icon="lock">
          {t("plans.readOnly")}
        </Callout>
      )}

      {groups.map((audience) => {
        const plans = data.filter((p) => p.audience === audience);
        return (
          <Section
            key={audience}
            id={`plans-${audience.toLowerCase()}`}
            title={labels.audience(audience)}
            description={audience === "INDIVIDUAL" ? t("plans.individualsHint") : t("plans.organizationsHint")}
          >
            {plans.length === 0 ? (
              <EmptyState
                className="border-none py-8"
                icon="workspace_premium"
                title={t("plans.emptyGroup")}
                body={viewer.isSuperadmin ? t("plans.emptyGroupHint") : undefined}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    canEdit={viewer.isSuperadmin}
                    onEdit={() => {
                      setLastPlan(plan);
                      setDialog({ plan });
                    }}
                  />
                ))}
              </div>
            )}
          </Section>
        );
      })}

      {viewer.isSuperadmin && (
        <PlanFormDialog
          open={dialog !== null}
          onOpenChange={(open) => !open && setDialog(null)}
          plan={dialog?.plan ?? lastPlan}
          onSaved={saved}
        />
      )}
    </div>
  );
}
