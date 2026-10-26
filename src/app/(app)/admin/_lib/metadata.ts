import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** Browser-tab title of a control-center page, e.g. "Organizations · Control center". */
export async function adminPageMetadata(titleKey: string): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: `${t(titleKey)} · ${t("meta.section")} | Bio-Dosha-12` };
}
