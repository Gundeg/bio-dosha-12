import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.reset");
  return {
    title: `${t("metaTitle")} | Bio-Dosha-12`,
    // The token in the URL is a credential: keep it out of Referer headers and search engines.
    referrer: "no-referrer",
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
