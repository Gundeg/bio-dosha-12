import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrgWorkspace, OrgSkeleton } from "@/components/org/OrgWorkspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

/** Organization workspace: /org?tab=overview|members|invites|settings */
export default function OrgPage() {
  return (
    <Suspense fallback={<OrgSkeleton />}>
      <OrgWorkspace />
    </Suspense>
  );
}
