"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";
import {
  DataTable,
  FilterTabs,
  PageHeader,
  Pagination,
  Section,
  StatusBadge,
  useApiQuery,
  useErrorMessage,
  withQuery,
  type Column,
} from "@/components/kit";
import { useAdminViewer } from "./AdminViewer";
import { DateText, InviteStateBadge } from "./badges";
import { useAdminLabels, usePageFor, useQueryParam } from "./hooks";
import { InviteActions, InviteLinkDialog, InviteLinkNotice } from "./InviteActions";
import { PAGE_SIZE, type InviteState, type OrgRole, type OrgStatus, type Paged, type PlatformRole } from "./lib";
import type { OneTimeLink } from "./OneTimeLinkDialog";
import { StaffInviteDialog } from "./StaffInviteDialog";
import { Icon } from "@/components/ui/icon";

interface InviteItem {
  id: string;
  email: string;
  kind: "staff" | "organization";
  platformRole: PlatformRole | null;
  orgRole: OrgRole | null;
  organization: { id: string; name: string; status: OrgStatus } | null;
  state: InviteState;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string } | null;
}

const KIND_FILTERS = ["all", "staff", "organization"] as const;
const STATE_FILTERS = ["all", "pending", "used", "revoked", "expired"] as const;
type KindFilter = (typeof KIND_FILTERS)[number];
type StateFilter = (typeof STATE_FILTERS)[number];

export function InvitesList() {
  const t = useTranslations("admin");
  const labels = useAdminLabels();
  const viewer = useAdminViewer();
  const describe = useErrorMessage();
  const [kind, setKind] = useQueryParam<KindFilter>("kind", KIND_FILTERS, "all");
  const [state, setState] = useQueryParam<StateFilter>("state", STATE_FILTERS, "all");
  const [page, setPage] = usePageFor(`${kind}|${state}`);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [link, setLink] = useState<OneTimeLink | null>(null);

  const { data, error, loading, reload } = useApiQuery<Paged<InviteItem>>(
    withQuery("/api/admin/invites", {
      kind: kind === "all" ? null : kind,
      state: state === "all" ? null : state,
      page,
      pageSize: PAGE_SIZE,
    })
  );

  const columns: Column<InviteItem>[] = [
    { key: "email", header: t("invites.columns.email"), primary: true, cell: (i) => <span className="break-all">{i.email}</span> },
    {
      key: "kind",
      header: t("invites.columns.kind"),
      cell: (i) => (
        <StatusBadge tone={i.kind === "staff" ? "info" : "neutral"} dot={false} icon={i.kind === "staff" ? "admin_panel_settings" : "domain"}>
          {t(`invites.kind.${i.kind}`)}
        </StatusBadge>
      ),
    },
    {
      key: "role",
      header: t("invites.columns.role"),
      cell: (i) => (i.platformRole ? labels.role(i.platformRole) : labels.orgRole(i.orgRole)),
    },
    {
      key: "organization",
      header: t("invites.columns.organization"),
      cell: (i) =>
        i.organization ? (
          <Link
            href={`/admin/organizations/${i.organization.id}`}
            className="font-medium text-on-surface underline-offset-2 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {i.organization.name}
          </Link>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    { key: "state", header: t("invites.columns.state"), cell: (i) => <InviteStateBadge state={i.state} /> },
    {
      key: "createdBy",
      header: t("invites.columns.createdBy"),
      hideOnMobile: true,
      cell: (i) =>
        i.createdBy ? (
          <span className="block min-w-0">
            <span className="block">{i.createdBy.name}</span>
            <span className="block break-all text-xs text-on-surface-variant">{i.createdBy.email}</span>
          </span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    { key: "created", header: t("invites.columns.created"), cell: (i) => <DateText value={i.createdAt} />, hideOnMobile: true },
    {
      key: "expires",
      header: t("invites.columns.expires"),
      cell: (i) =>
        i.state === "used" ? (
          <span className="text-xs text-on-surface-variant">
            {t("invites.acceptedOn", { date: labels.date(i.usedAt) ?? "—" })}
          </span>
        ) : (
          <DateText value={i.expiresAt} withTime />
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("invites.columns.actions")}</span>,
      align: "right",
      cell: (i) =>
        i.kind === "staff" && !viewer.isSuperadmin ? (
          <span className="text-xs text-on-surface-variant">{t("invites.superadminOnly")}</span>
        ) : (
          <InviteActions invite={i} onChanged={reload} onLinkCreated={setLink} />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("invites.title")}
        description={t("invites.description")}
        actions={
          viewer.isSuperadmin ? (
            <Button size="lg" onClick={() => setInviteOpen(true)}>
              <Icon name="person_add" className="size-4" />
              {t("invites.inviteStaff")}
            </Button>
          ) : undefined
        }
      />

      <InviteLinkNotice />

      <Section bodyClassName="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            label={t("invites.filters.kindLabel")}
            value={kind}
            onChange={setKind}
            options={KIND_FILTERS.map((value) => ({ value, label: t(`invites.filters.kind.${value}`) }))}
          />
          <FilterTabs
            label={t("invites.filters.stateLabel")}
            value={state}
            onChange={setState}
            options={STATE_FILTERS.map((value) => ({
              value,
              label: value === "all" ? t("invites.filters.allStates") : labels.inviteState(value),
            }))}
          />
        </div>

        <p className="sr-only" aria-live="polite">
          {data && !loading ? t("invites.resultCount", { count: data.total }) : ""}
        </p>

        {error ? (
          <ErrorState message={describe(error)} onRetry={reload} />
        ) : (
          <>
            <DataTable
              caption={t("invites.caption")}
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(i) => i.id}
              loading={loading}
              empty={
                <div className="space-y-1">
                  <p className="font-medium text-on-surface">{t("invites.empty")}</p>
                  <p>{viewer.isSuperadmin ? t("invites.emptyHintSuperadmin") : t("invites.emptyHint")}</p>
                </div>
              }
            />
            {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
          </>
        )}
      </Section>

      {viewer.isSuperadmin && (
        <StaffInviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onCreated={(created) => {
            setLink(created);
            toast.success(t("staffInvite.created", { email: created.email }));
            reload();
          }}
        />
      )}
      <InviteLinkDialog link={link} onClose={() => setLink(null)} />
    </div>
  );
}
