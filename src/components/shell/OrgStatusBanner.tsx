"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Callout } from "@/components/kit/layout";
import { ButtonLink } from "@/components/ui/button-link";
import { isActivePath } from "./nav";
import { useShell } from "./ShellProvider";

/**
 * Tells members of a pending or suspended organization why patient records
 * are closed and where to see the status. Hidden in the control center and on
 * the organization page itself, which shows the status in full.
 */
export function OrgStatusBanner() {
  const pathname = usePathname();
  const t = useTranslations("nav.orgBanner");
  const { access, activeMembership } = useShell();
  const status = access.org?.orgStatus;

  if (status !== "PENDING" && status !== "SUSPENDED") return null;
  if (isActivePath(pathname, "/admin") || isActivePath(pathname, "/org")) return null;

  const name = activeMembership?.organizationName;
  const pending = status === "PENDING";

  return (
    <Callout
      tone={pending ? "warning" : "danger"}
      icon={pending ? "hourglass_top" : "block"}
      className="mb-6"
      title={
        pending
          ? name
            ? t("pendingTitleNamed", { name })
            : t("pendingTitle")
          : name
            ? t("suspendedTitleNamed", { name })
            : t("suspendedTitle")
      }
      action={
        <ButtonLink href="/org" size="lg" variant="outline" className="w-full sm:w-auto">
          {t("viewStatus")}
        </ButtonLink>
      }
    >
      {pending ? t("pendingBody") : t("suspendedBody")}
    </Callout>
  );
}
