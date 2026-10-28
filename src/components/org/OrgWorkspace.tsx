"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Callout, PageHeader, StatusBadge, orgStatusTone, useApiQuery, useErrorMessage } from "@/components/kit";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/states";
import { apiFetch } from "@/lib/api";
import {
  PageTabPanel,
  PageTabs,
  QueryView,
  SelectInput,
  useTabParam,
  type PageTabItem,
  type QueryLike,
} from "@/components/settings/shared";
import { MANAGER_ROLES, mfaSetupHref, type Me, type MeMembership } from "@/components/settings/types";
import { NoOrganization } from "./NoOrganization";
import { OverviewTab } from "./OverviewTab";
import { MembersTab } from "./MembersTab";
import { InvitesTab } from "./InvitesTab";
import { OrgSettingsTab } from "./OrgSettingsTab";
import type { OrgDetail, OrgInvite, OrgMember } from "./types";

const ALL_TABS = ["overview", "members", "invites", "settings"] as const;
type OrgTab = (typeof ALL_TABS)[number];
const MEMBER_TABS: readonly OrgTab[] = ["overview", "members", "settings"];

export function OrgPanelSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

/** Whole-page placeholder (Suspense fallback and first load). */
export function OrgSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-8 h-9 w-72 max-w-full" />
      <Skeleton className="mb-6 h-10" />
      <OrgPanelSkeleton />
    </div>
  );
}

export function OrgWorkspace() {
  const me = useApiQuery<Me>("/api/me");
  return (
    <QueryView query={me} skeleton={<OrgSkeleton />}>
      {(data) => <WorkspaceForUser me={data} reloadMe={me.reload} />}
    </QueryView>
  );
}

function WorkspaceForUser({ me, reloadMe }: { me: Me; reloadMe: () => void }) {
  const active = me.memberships.filter((m) => m.status === "ACTIVE");
  const current = active.find((m) => m.organizationId === me.activeOrganizationId) ?? null;
  if (!current) {
    return <NoOrganization me={me} onRegistered={reloadMe} />;
  }
  // Remount per organization so its data and forms never leak into another one.
  return <Workspace key={current.organizationId} me={me} membership={current} memberships={active} reloadMe={reloadMe} />;
}

function Workspace({
  me,
  membership,
  memberships,
  reloadMe,
}: {
  me: Me;
  membership: MeMembership;
  memberships: MeMembership[];
  reloadMe: () => void;
}) {
  const t = useTranslations("org");
  const orgId = membership.organizationId;
  const canManage = MANAGER_ROLES.includes(membership.role);
  const tabs = canManage ? ALL_TABS : MEMBER_TABS;
  const [tab, setTab] = useTabParam(tabs, "overview");

  const detail = useApiQuery<OrgDetail>(`/api/org/${orgId}`);
  const members = useApiQuery<OrgMember[]>(`/api/org/${orgId}/members`);
  const invites = useApiQuery<OrgInvite[]>(canManage ? `/api/org/${orgId}/invites` : null);

  const status = detail.data?.organization.status ?? membership.organizationStatus;
  const name = detail.data?.organization.name ?? membership.organizationName;
  const typeKey = detail.data?.organization.type;

  const items: PageTabItem<OrgTab>[] = [
    { value: "overview", label: t("tabs.overview"), icon: "space_dashboard" },
    { value: "members", label: t("tabs.members"), icon: "group" },
    ...(canManage ? [{ value: "invites" as const, label: t("tabs.invites"), icon: "forward_to_inbox" as const }] : []),
    { value: "settings", label: t("tabs.settings"), icon: "tune" },
  ];

  const panel = <T,>(query: QueryLike<T>, render: (data: T) => React.ReactNode) => (
    <QueryView query={query} skeleton={<OrgPanelSkeleton />}>
      {render}
    </QueryView>
  );

  const reloadAfterMemberChange = () => {
    members.reload();
    detail.reload();
  };

  return (
    <div>
      {memberships.length > 1 && <OrganizationSwitcher memberships={memberships} currentId={orgId} reloadMe={reloadMe} />}

      <PageHeader
        eyebrow={t("eyebrow")}
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {typeKey && <span>{t.has(`types.${typeKey}`) ? t(`types.${typeKey}`) : typeKey}</span>}
            {typeKey && <span aria-hidden="true">·</span>}
            <span>{t("header.yourRole", { role: t(`roles.${membership.role}.label`) })}</span>
          </span>
        }
        actions={<StatusBadge tone={orgStatusTone(status)}>{t(`orgStatus.${status}`)}</StatusBadge>}
      />

      {me.mfa.required && !me.mfa.enabled && (
        <Callout
          tone="warning"
          className="mb-6"
          title={t("header.mfaTitle")}
          action={
            <ButtonLink href={mfaSetupHref("/org")} size="lg">
              {t("header.mfaAction")}
            </ButtonLink>
          }
        >
          {t("header.mfaBody")}
        </Callout>
      )}

      <PageTabs value={tab} onValueChange={setTab} label={t("tabs.label")} items={items}>
        <PageTabPanel value="overview">
          {panel(detail, (data) => (
            <OverviewTab detail={data} membership={membership} />
          ))}
        </PageTabPanel>
        <PageTabPanel value="members">
          {panel(members, (list) => (
            <MembersTab
              orgId={orgId}
              organizationName={name}
              members={list}
              detail={detail.data}
              myRole={membership.role}
              canManage={canManage}
              onChanged={reloadAfterMemberChange}
            />
          ))}
        </PageTabPanel>
        {canManage && (
          <PageTabPanel value="invites">
            {panel(invites, (list) => (
              <InvitesTab
                orgId={orgId}
                invites={list}
                detail={detail.data}
                myRole={membership.role}
                emailEnabled={me.emailEnabled}
                onChanged={invites.reload}
              />
            ))}
          </PageTabPanel>
        )}
        <PageTabPanel value="settings">
          {panel(detail, (data) => (
            <OrgSettingsTab
              detail={data}
              onSaved={() => {
                detail.reload();
                reloadMe();
              }}
            />
          ))}
        </PageTabPanel>
      </PageTabs>
    </div>
  );
}

/** Shown when the person belongs to several organizations. */
function OrganizationSwitcher({
  memberships,
  currentId,
  reloadMe,
}: {
  memberships: MeMembership[];
  currentId: string;
  reloadMe: () => void;
}) {
  const t = useTranslations("org.switcher");
  const router = useRouter();
  const describe = useErrorMessage();
  const { update } = useSession();
  // The chosen organization while switching; the workspace remounts once /api/me reloads.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = pendingId !== null;

  async function switchTo(organizationId: string) {
    if (organizationId === currentId || busy) return;
    setPendingId(organizationId);
    setError(null);
    try {
      await apiFetch("/api/org/active", { method: "PUT", body: JSON.stringify({ organizationId }) });
      await update({}); // {} forces a claim refresh (see src/components/auth/session.ts)
      router.refresh();
      reloadMe();
    } catch (err) {
      setError(describe(err));
      setPendingId(null);
    }
  }

  return (
    <div className="mb-5 flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center sm:gap-4">
      <label htmlFor="org-switcher" className="shrink-0 text-sm font-medium text-on-surface">
        {t("label")}
      </label>
      <div className="min-w-0 flex-1 sm:max-w-md">
        <SelectInput
          id="org-switcher"
          value={pendingId ?? currentId}
          disabled={busy}
          aria-describedby="org-switcher-status"
          onChange={(e) => switchTo(e.target.value)}
        >
          {memberships.map((m) => (
            <option key={m.organizationId} value={m.organizationId}>
              {m.organizationName}
            </option>
          ))}
        </SelectInput>
      </div>
      <p id="org-switcher-status" aria-live="polite" className="text-sm text-on-surface-variant">
        {busy ? t("switching") : error ? <span className="text-error">{error}</span> : t("hint")}
      </p>
    </div>
  );
}
