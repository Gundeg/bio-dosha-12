import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InviteAcceptance } from "@/components/auth/InviteAcceptance";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.invite");
  return {
    title: `${t("metaTitle")} | Bio-Dosha-12`,
    // The token in the URL is a credential: keep it out of Referer headers and search engines.
    referrer: "no-referrer",
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteAcceptance token={token} />;
}
