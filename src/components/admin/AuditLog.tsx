"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/states";
import {
  Callout,
  DataTable,
  PageHeader,
  Pagination,
  Section,
  useApiQuery,
  useDebouncedValue,
  useErrorMessage,
  withQuery,
  type Column,
} from "@/components/kit";
import { SuperadminOnly } from "./AdminStates";
import { useAdminViewer } from "./AdminViewer";
import { DateText } from "./badges";
import { SelectField, TextField, type SelectOption } from "./fields";
import { useAdminLabels, usePageFor } from "./hooks";
import { dayBoundaryIso, shortId, type Paged } from "./lib";
import { Icon } from "@/components/ui/icon";

interface AuditItem {
  id: string;
  at: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  organizationId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  meta: Record<string, string | number | boolean | null> | null;
}

/** GET /api/admin/audit */
interface AuditResponse extends Paged<AuditItem> {
  actions: string[];
}

const AUDIT_PAGE_SIZE = 50;
/** Groups whose events share one prefix, so "all of the group" is one filter. */
const PREFIX_GROUPS = ["auth", "account", "admin", "org"] as const;
const CLINICAL_PREFIXES = ["patient", "intake", "record"];

function groupOf(action: string): string {
  const prefix = action.split(".")[0];
  if ((PREFIX_GROUPS as readonly string[]).includes(prefix)) return prefix;
  if (CLINICAL_PREFIXES.includes(prefix)) return "clinical";
  return "other";
}

function MetaChips({ meta }: { meta: AuditItem["meta"] }) {
  const tk = useTranslations("kit");
  const entries = Object.entries(meta ?? {});
  if (entries.length === 0) return <span className="text-on-surface-variant">—</span>;
  return (
    <span className="flex flex-wrap justify-end gap-1 md:justify-start">
      {entries.map(([key, value]) => {
        const text = value === null ? "—" : typeof value === "boolean" ? (value ? tk("yes") : tk("no")) : String(value);
        return (
          <span
            key={key}
            title={`${key}: ${text}`}
            className="inline-flex max-w-[16rem] items-center gap-1 rounded-md bg-surface-container px-1.5 py-0.5 text-[11px] text-on-surface"
          >
            <span className="shrink-0 font-mono text-on-surface-variant">{key}:</span>
            <span className="truncate">{text}</span>
          </span>
        );
      })}
    </span>
  );
}

function AuditLogView() {
  const t = useTranslations("admin");
  const labels = useAdminLabels();
  const describe = useErrorMessage();
  const searchParams = useSearchParams();

  // Links from other pages pre-fill the filters (e.g. ?actor=… or ?organizationId=…).
  const [action, setAction] = useState(() => searchParams.get("action") ?? "");
  const [actorInput, setActorInput] = useState(() => searchParams.get("actor") ?? "");
  const [targetInput, setTargetInput] = useState(() => searchParams.get("targetId") ?? "");
  const [organizationId, setOrganizationId] = useState(() => searchParams.get("organizationId") ?? "");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const actor = useDebouncedValue(actorInput.trim(), 350);
  const targetId = useDebouncedValue(targetInput.trim(), 350);

  const from = fromDay ? dayBoundaryIso(fromDay, "start") : null;
  const to = toDay ? dayBoundaryIso(toDay, "end") : null;
  const rangeInvalid = !!from && !!to && from > to;
  const filters = {
    action: action || null,
    actor: actor || null,
    targetId: targetId || null,
    organizationId: organizationId || null,
    from: rangeInvalid ? null : from,
    to: rangeInvalid ? null : to,
  };
  const filterKey = JSON.stringify(filters);
  const [page, setPage] = usePageFor(filterKey);
  const { data, error, loading, reload } = useApiQuery<AuditResponse>(
    withQuery("/api/admin/audit", { ...filters, page, pageSize: AUDIT_PAGE_SIZE })
  );
  const anyFilter = Object.values(filters).some(Boolean) || !!fromDay || !!toDay;

  function clearFilters() {
    setAction("");
    setActorInput("");
    setTargetInput("");
    setOrganizationId("");
    setFromDay("");
    setToDay("");
  }

  // Action filter: grouped by prefix, each group can be chosen as a whole.
  const known = data?.actions ?? [];
  const actionCodes = action && !action.endsWith(".") && !known.includes(action) ? [...known, action] : known;
  const groupOrder = [...PREFIX_GROUPS, "clinical", "other"];
  const actionGroups = groupOrder
    .map((group) => {
      const codes = actionCodes.filter((code) => groupOf(code) === group);
      if (codes.length === 0) return null;
      const options: SelectOption[] = [];
      if ((PREFIX_GROUPS as readonly string[]).includes(group)) {
        options.push({ value: `${group}.`, label: t("audit.filters.allInGroup", { group: t(`audit.groups.${group}`) }) });
      }
      for (const code of codes) options.push({ value: code, label: labels.action(code) });
      return { label: t(`audit.groups.${group}`), options };
    })
    .filter((g): g is { label: string; options: SelectOption[] } => g !== null);
  // A group prefix from a link must stay selectable before the action list has loaded.
  const extraPrefix =
    action.endsWith(".") && !actionGroups.some((g) => g.options.some((o) => o.value === action))
      ? [{ value: action, label: action }]
      : [];

  const csvHref = withQuery("/api/admin/audit", { ...filters, format: "csv" });

  const columns: Column<AuditItem>[] = [
    { key: "at", header: t("audit.columns.time"), cell: (r) => <DateText value={r.at} withTime />, className: "whitespace-nowrap" },
    {
      key: "action",
      header: t("audit.columns.action"),
      primary: true,
      cell: (r) => (
        <span className="block min-w-0">
          <span className="block font-medium text-on-surface">{labels.action(r.action)}</span>
          <span className="block font-mono text-[11px] font-normal text-on-surface-variant">{r.action}</span>
        </span>
      ),
    },
    {
      key: "actor",
      header: t("audit.columns.actor"),
      cell: (r) => (
        <span className="block min-w-0">
          <span className="block break-all">{r.actorEmail ?? t("activity.system")}</span>
          {r.actorRole && <span className="block text-xs text-on-surface-variant">{labels.role(r.actorRole)}</span>}
        </span>
      ),
    },
    {
      key: "target",
      header: t("audit.columns.target"),
      cell: (r) =>
        r.targetType || r.targetId ? (
          <span className="inline-flex flex-wrap items-center gap-1">
            <span>{labels.targetType(r.targetType)}</span>
            {r.targetId && (
              <button
                type="button"
                title={r.targetId}
                aria-label={t("audit.filterByTarget", { id: r.targetId })}
                onClick={() => setTargetInput(r.targetId ?? "")}
                className="inline-flex h-7 items-center rounded-md px-1.5 font-mono text-xs text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
              >
                {shortId(r.targetId)}
              </button>
            )}
          </span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "ip",
      header: t("audit.columns.ip"),
      cell: (r) => <span className="font-mono text-xs">{r.ip ?? "—"}</span>,
      hideOnMobile: true,
    },
    { key: "meta", header: t("audit.columns.details"), cell: (r) => <MetaChips meta={r.meta} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("audit.title")}
        description={t("audit.description")}
        actions={
          <a href={csvHref} download className={buttonVariants({ variant: "outline", size: "lg" })}>
            <Icon name="download" className="size-4" />
            {t("audit.exportCsv")}
          </a>
        }
      />

      <Callout tone="info" icon="shield_lock">
        {t("audit.noHealthData")}
      </Callout>

      <Section
        title={t("audit.filters.title")}
        actions={
          anyFilter ? (
            <Button variant="ghost" size="lg" onClick={clearFilters}>
              <Icon name="filter_alt_off" className="size-4" />
              {t("audit.filters.clear")}
            </Button>
          ) : undefined
        }
        bodyClassName="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            className="sm:col-span-2 lg:col-span-1"
            label={t("audit.filters.action")}
            value={action}
            onChange={setAction}
            options={[{ value: "", label: t("audit.filters.allActions") }, ...extraPrefix]}
            groups={actionGroups}
          />
          <TextField
            label={t("audit.filters.actor")}
            type="search"
            value={actorInput}
            onChange={setActorInput}
            placeholder={t("audit.filters.actorPlaceholder")}
            maxLength={200}
          />
          <TextField
            label={t("audit.filters.target")}
            type="search"
            value={targetInput}
            onChange={setTargetInput}
            placeholder={t("audit.filters.targetPlaceholder")}
            maxLength={100}
            mono
          />
          <TextField label={t("audit.filters.from")} type="date" value={fromDay} onChange={setFromDay} max={toDay || undefined} />
          <TextField
            label={t("audit.filters.to")}
            type="date"
            value={toDay}
            onChange={setToDay}
            min={fromDay || undefined}
            error={rangeInvalid ? t("audit.filters.rangeInvalid") : undefined}
          />
          {organizationId && (
            <div className="flex items-end">
              <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-surface-container px-3 text-sm text-on-surface">
                {t("audit.filters.organization")}
                <span className="font-mono text-xs">{shortId(organizationId)}</span>
                <button
                  type="button"
                  onClick={() => setOrganizationId("")}
                  aria-label={t("audit.filters.removeOrganization")}
                  className="inline-flex size-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Icon name="close" className="size-4" />
                </button>
              </span>
            </div>
          )}
        </div>
      </Section>

      <Section
        title={t("audit.results.title")}
        description={data ? t("audit.results.count", { count: data.total }) : undefined}
      >
        <p className="sr-only" aria-live="polite">
          {data && !loading ? t("audit.results.count", { count: data.total }) : ""}
        </p>
        {error ? (
          <ErrorState message={describe(error)} onRetry={reload} />
        ) : (
          <>
            <DataTable
              caption={t("audit.results.title")}
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(r) => r.id}
              loading={loading}
              empty={
                <div className="space-y-1">
                  <p className="font-medium text-on-surface">{anyFilter ? t("audit.emptyFiltered") : t("audit.empty")}</p>
                  {anyFilter && <p>{t("audit.emptyFilteredHint")}</p>}
                </div>
              }
            />
            {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
          </>
        )}
      </Section>
    </div>
  );
}

/** Security log (superadmin only). Other staff get a plain explanation. */
export function AuditLog() {
  const t = useTranslations("admin");
  const viewer = useAdminViewer();
  if (!viewer.isSuperadmin) {
    return (
      <div>
        <PageHeader title={t("audit.title")} />
        <SuperadminOnly title={t("audit.onlySuperadminTitle")} body={t("audit.onlySuperadminBody")} />
      </div>
    );
  }
  return <AuditLogView />;
}
