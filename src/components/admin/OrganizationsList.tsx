"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";
import {
  DataTable,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  Section,
  useApiQuery,
  useDebouncedValue,
  useErrorMessage,
  withQuery,
  type Column,
} from "@/components/kit";
import { formatNumber } from "@/lib/formatNumber";
import { OrgStatusBadge, DateText } from "./badges";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { useAdminLabels, usePageFor, useQueryParam } from "./hooks";
import { PAGE_SIZE, type OrgStatus, type Paged, type PlanRef } from "./lib";
import { Icon } from "@/components/ui/icon";

interface OrgListItem {
  id: string;
  name: string;
  type: string;
  city: string | null;
  status: OrgStatus;
  createdAt: string;
  verifiedAt: string | null;
  suspendedAt: string | null;
  owner: { id: string; name: string; email: string } | null;
  memberCount: number;
  patientCount: number;
  plan: PlanRef | null;
}

/** GET /api/admin/organizations */
interface OrgListResponse extends Paged<OrgListItem> {
  counts: Partial<Record<OrgStatus, number>>;
}

const STATUS_FILTERS = ["all", "PENDING", "ACTIVE", "SUSPENDED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function OrganizationsList() {
  const t = useTranslations("admin");
  const labels = useAdminLabels();
  const describe = useErrorMessage();
  const [status, setStatus] = useQueryParam<StatusFilter>("status", STATUS_FILTERS, "all");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim(), 300);
  const [page, setPage] = usePageFor(`${status}|${q}`);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, error, loading, reload } = useApiQuery<OrgListResponse>(
    withQuery("/api/admin/organizations", { q, status: status === "all" ? null : status, page, pageSize: PAGE_SIZE })
  );

  const counts = data?.counts;
  const total = counts ? (counts.PENDING ?? 0) + (counts.ACTIVE ?? 0) + (counts.SUSPENDED ?? 0) : undefined;
  const tabs = STATUS_FILTERS.map((value) => ({
    value,
    label: value === "all" ? t("orgs.filters.all") : labels.orgStatus(value),
    count: value === "all" ? total : counts ? (counts[value] ?? 0) : undefined,
  }));

  const columns: Column<OrgListItem>[] = [
    {
      key: "name",
      header: t("orgs.columns.name"),
      primary: true,
      cell: (o) => <span className="break-words">{o.name}</span>,
    },
    { key: "type", header: t("orgs.columns.type"), cell: (o) => labels.orgType(o.type), hideOnMobile: true },
    { key: "city", header: t("orgs.columns.city"), cell: (o) => o.city ?? "—" },
    {
      key: "owner",
      header: t("orgs.columns.owner"),
      cell: (o) =>
        o.owner ? (
          <span className="block min-w-0">
            <span className="block text-on-surface">{o.owner.name}</span>
            <span className="block break-all text-xs text-on-surface-variant">{o.owner.email}</span>
          </span>
        ) : (
          <span className="text-xs text-on-surface-variant">{t("orgs.noOwner")}</span>
        ),
    },
    {
      key: "members",
      header: t("orgs.columns.members"),
      align: "right",
      cell: (o) => <span className="tabular-nums">{formatNumber(o.memberCount)}</span>,
      hideOnMobile: true,
    },
    {
      key: "patients",
      header: t("orgs.columns.patients"),
      align: "right",
      cell: (o) => <span className="tabular-nums">{formatNumber(o.patientCount)}</span>,
    },
    {
      key: "plan",
      header: t("orgs.columns.plan"),
      cell: (o) =>
        o.plan ? labels.planName(o.plan) : <span className="text-on-surface-variant">{t("planSource.default")}</span>,
      hideOnMobile: true,
    },
    { key: "status", header: t("orgs.columns.status"), cell: (o) => <OrgStatusBadge status={o.status} /> },
    { key: "created", header: t("orgs.columns.registered"), cell: (o) => <DateText value={o.createdAt} /> },
  ];

  const filtered = q !== "" || status !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("orgs.title")}
        description={t("orgs.description")}
        actions={
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Icon name="add_business" className="size-4" />
            {t("orgs.add")}
          </Button>
        }
      />

      <Section bodyClassName="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs label={t("orgs.filters.label")} options={tabs} value={status} onChange={setStatus} />
          <SearchInput
            value={query}
            onChange={setQuery}
            label={t("orgs.searchLabel")}
            placeholder={t("orgs.searchPlaceholder")}
            className="lg:max-w-sm"
          />
        </div>

        <p className="sr-only" aria-live="polite">
          {data && !loading ? t("orgs.resultCount", { count: data.total }) : ""}
        </p>

        {error ? (
          <ErrorState message={describe(error)} onRetry={reload} />
        ) : (
          <>
            <DataTable
              caption={t("orgs.caption")}
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(o) => o.id}
              rowHref={(o) => `/admin/organizations/${o.id}`}
              loading={loading}
              empty={
                <div className="space-y-3">
                  <p className="font-medium text-on-surface">{filtered ? t("orgs.emptyFiltered") : t("orgs.empty")}</p>
                  <p>{filtered ? t("orgs.emptyFilteredHint") : t("orgs.emptyHint")}</p>
                  {!filtered && (
                    <Button variant="outline" size="lg" onClick={() => setCreateOpen(true)}>
                      {t("orgs.add")}
                    </Button>
                  )}
                </div>
              }
            />
            {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
          </>
        )}
      </Section>

      <CreateOrganizationDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={reload} />
    </div>
  );
}
