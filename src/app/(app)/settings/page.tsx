import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsView, SettingsSkeleton } from "@/components/settings/SettingsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

/** Account settings: /settings?tab=profile|security|privacy */
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsView />
    </Suspense>
  );
}
