"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useShell } from "./ShellProvider";

/**
 * Second line of the "Organization" menu item while the organization is
 * pending or suspended: a dot plus words, never color alone.
 */
export function OrgNavHint({ className }: { className?: string }) {
  const { access } = useShell();
  const t = useTranslations("nav.orgStatus");
  const status = access.org?.orgStatus;
  if (status !== "PENDING" && status !== "SUSPENDED") return null;

  const pending = status === "PENDING";
  return (
    <span className={cn("mt-0.5 flex min-w-0 items-center gap-1.5 font-normal", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", pending ? "bg-amber-500" : "bg-red-600")} aria-hidden="true" />
      <span className={cn("truncate", pending ? "text-amber-800" : "text-red-700")}>{t(status)}</span>
    </span>
  );
}

/** Heading of the organization menu section: the organization's name once known. */
export function useOrgSectionTitle(): string {
  const { activeMembership } = useShell();
  const t = useTranslations("nav");
  return activeMembership?.organizationName ?? t("organizationSection");
}
