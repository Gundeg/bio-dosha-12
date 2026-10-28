"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/states";
import {
  DataTable,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  Section,
  StatusBadge,
  useApiQuery,
  useDebouncedValue,
  useErrorMessage,
  withQuery,
  type Column,
} from "@/components/kit";
import { useAdminViewer } from "./AdminViewer";
import { AccountStatusBadge, DateText, MfaBadge, RoleBadge } from "./badges";
import { useAdminLabels, usePageFor, useQueryParam } from "./hooks";
import { PAGE_SIZE, isStaffRole, type MemberStatus, type OrgRole, type OrgStatus, type Paged, type PlatformRole } from "./lib";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  disabledAt: string | null;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  profileCount: number;
  memberships: {
    organizationId: string;
    organizationName: string;
    organizationStatus: OrgStatus;
    role: OrgRole;
    status: MemberStatus;
  }[];
}

const TYPE_FILTERS = ["all", "individual", "member", "staff"] as const;
const STATUS_FILTERS = ["all", "active", "disabled"] as const;
const MFA_FILTERS = ["all", "off"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];
type MfaFilter = (typeof MFA_FILTERS)[number];

export function UsersList() {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const labels = useAdminLabels();
  const viewer = useAdminViewer();
  const describe = useErrorMessage();
  const [type, setType] = useQueryParam<TypeFilter>("type", TYPE_FILTERS, "all");
  const [status, setStatus] = useQueryParam<StatusFilter>("status", STATUS_FILTERS, "all");
  const [mfa, setMfa] = useQueryParam<MfaFilter>("mfa", MFA_FILTERS, "all");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim(), 300);
  const [page, setPage] = usePageFor(`${type}|${status}|${mfa}|${q}`);

  const { data, error, loading, reload } = useApiQuery<Paged<UserListItem>>(
    withQuery("/api/admin/users", {
      q,
      type: type === "all" ? null : type,
      status: status === "all" ? null : status,
      mfa: mfa === "all" ? null : mfa,
      page,
      pageSize: PAGE_SIZE,
    })
  );

  const columns: Column<UserListItem>[] = [
    {
      key: "name",
      header: t("users.columns.name"),
      primary: true,
      cell: (u) => (
        <span className="block min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="break-words">{u.name}</span>
            {u.id === viewer.id && <StatusBadge tone="primary" dot={false}>{t("common.you")}</StatusBadge>}
          </span>
          <span className="block break-all text-xs font-normal text-on-surface-variant">{u.email}</span>
        </span>
      ),
    },
    { key: "role", header: t("users.columns.role"), cell: (u) => <RoleBadge role={u.role} /> },
    {
      key: "orgs",
      header: t("users.columns.organizations"),
      cell: (u) =>
        u.memberships.length === 0 ? (
          <span className="text-on-surface-variant">—</span>
        ) : (
          <span className="flex flex-wrap justify-end gap-1 md:justify-start">
            {u.memberships.map((m) => (
              <span
                key={m.organizationId}
                className="inline-flex max-w-full items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-xs text-on-surface"
              >
                <span className="min-w-0 truncate">{m.organizationName}</span>
                <span className="shrink-0 text-on-surface-variant">· {labels.orgRole(m.role)}</span>
                {m.status === "DISABLED" && <span className="text-red-700">· {labels.memberStatus("DISABLED")}</span>}
              </span>
            ))}
          </span>
        ),
    },
    {
      key: "mfa",
      header: t("users.columns.mfa"),
      cell: (u) => <MfaBadge enabled={u.mfaEnabled} required={isStaffRole(u.role) || u.memberships.some((m) => m.status === "ACTIVE")} />,
    },
    {
      key: "lastLogin",
      header: t("users.columns.lastLogin"),
      cell: (u) => <DateText value={u.lastLoginAt} withTime emptyLabel={tk("never")} />,
    },
    { key: "created", header: t("users.columns.created"), cell: (u) => <DateText value={u.createdAt} />, hideOnMobile: true },
    { key: "status", header: t("users.columns.status"), cell: (u) => <AccountStatusBadge disabled={!!u.disabledAt} /> },
  ];

  const filtered = q !== "" || type !== "all" || status !== "all" || mfa !== "all";

  return (
    <div className="space-y-6">
      <PageHeader title={t("users.title")} description={t("users.description")} />

      <Section bodyClassName="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs
              label={t("users.filters.typeLabel")}
              value={type}
              onChange={setType}
              options={TYPE_FILTERS.map((value) => ({ value, label: t(`users.filters.type.${value}`) }))}
            />
            <SearchInput
              value={query}
              onChange={setQuery}
              label={t("users.searchLabel")}
              placeholder={t("users.searchPlaceholder")}
              className="lg:max-w-sm"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <FilterTabs
              label={t("users.filters.statusLabel")}
              value={status}
              onChange={setStatus}
              options={STATUS_FILTERS.map((value) => ({ value, label: t(`users.filters.status.${value}`) }))}
            />
            <FilterTabs
              label={t("users.filters.mfaLabel")}
              value={mfa}
              onChange={setMfa}
              options={MFA_FILTERS.map((value) => ({ value, label: t(`users.filters.mfa.${value}`) }))}
            />
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {data && !loading ? t("users.resultCount", { count: data.total }) : ""}
        </p>

        {error ? (
          <ErrorState message={describe(error)} onRetry={reload} />
        ) : (
          <>
            <DataTable
              caption={t("users.caption")}
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(u) => u.id}
              rowHref={(u) => `/admin/users/${u.id}`}
              loading={loading}
              empty={
                <div className="space-y-1">
                  <p className="font-medium text-on-surface">{filtered ? t("users.emptyFiltered") : t("users.empty")}</p>
                  <p>{filtered ? t("users.emptyFilteredHint") : t("users.emptyHint")}</p>
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
