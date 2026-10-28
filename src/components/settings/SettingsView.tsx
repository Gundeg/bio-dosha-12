"use client";

import { useTranslations } from "next-intl";
import { PageHeader, useApiQuery } from "@/components/kit";
import { Skeleton } from "@/components/states";
import { PageTabPanel, PageTabs, QueryView, useTabParam } from "./shared";
import { ProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import { PrivacyTab } from "./PrivacyTab";
import type { Me } from "./types";

const TABS = ["profile", "security", "privacy"] as const;

/** Placeholder for one tab's content while /api/me loads. */
export function SettingsPanelSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}

/** Whole-page placeholder (Suspense fallback). */
export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl" aria-busy="true">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-8 h-9 w-56" />
      <Skeleton className="mb-6 h-10" />
      <SettingsPanelSkeleton />
    </div>
  );
}

export function SettingsView() {
  const t = useTranslations("settings");
  const [tab, setTab] = useTabParam(TABS, "profile");
  const me = useApiQuery<Me>("/api/me");

  const panel = (render: (data: Me) => React.ReactNode) => (
    <QueryView query={me} skeleton={<SettingsPanelSkeleton />}>
      {render}
    </QueryView>
  );

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <PageTabs
        value={tab}
        onValueChange={setTab}
        label={t("tabs.label")}
        items={[
          { value: "profile", label: t("tabs.profile"), icon: "badge" },
          { value: "security", label: t("tabs.security"), icon: "shield_lock" },
          { value: "privacy", label: t("tabs.privacy"), icon: "privacy_tip" },
        ]}
      >
        <PageTabPanel value="profile">
          {panel((data) => (
            <ProfileTab me={data} mutate={me.mutate} />
          ))}
        </PageTabPanel>
        <PageTabPanel value="security">
          {panel((data) => (
            <SecurityTab me={data} reload={me.reload} />
          ))}
        </PageTabPanel>
        <PageTabPanel value="privacy">{panel((data) => <PrivacyTab me={data} />)}</PageTabPanel>
      </PageTabs>
    </div>
  );
}
