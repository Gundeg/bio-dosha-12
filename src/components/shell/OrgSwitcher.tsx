"use client";

import { useId, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useErrorMessage } from "@/components/kit/hooks";
import { cn } from "@/lib/utils";
import { isActivePath, isClinicalClaim } from "./nav";
import { useShell } from "./ShellProvider";

/**
 * Lets people who belong to two or more organizations choose the one they are
 * working in. The choice is stored on the account (PUT /api/org/active); the
 * session is then refreshed so the menu, the proxy and the API agree.
 */
export function OrgSwitcher({
  className,
  onSwitched,
}: {
  className?: string;
  /** Called after a successful switch, e.g. to close the menu sheet. */
  onSwitched?: () => void;
}) {
  const { access, memberships } = useShell();
  const { update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav.orgSwitcher");
  const errorMessage = useErrorMessage();
  const selectId = useId();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const currentId = access.org?.id;
  if (!currentId || !memberships || memberships.length < 2) return null;

  async function switchTo(organizationId: string) {
    if (organizationId === currentId || !memberships) return;
    const name = memberships.find((m) => m.organizationId === organizationId)?.organizationName ?? "";
    setSwitchingTo(organizationId);
    try {
      await apiFetch("/api/org/active", { method: "PUT", body: JSON.stringify({ organizationId }) });
      const next = await update({}); // {} forces a claim refresh (see src/components/auth/session.ts)
      const clinical = isClinicalClaim(next?.user?.org);
      // A patient card belongs to the previous organization; clinical pages
      // are closed when the new organization is not clinical for this person.
      if (pathname.startsWith("/patients/")) {
        router.push(clinical ? "/patients" : "/org");
      } else if (!clinical && (isActivePath(pathname, "/patients") || isActivePath(pathname, "/reports"))) {
        router.push("/org");
      } else {
        router.refresh();
      }
      toast.success(t("switched", { name }));
      onSwitched?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSwitchingTo(null);
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={selectId} className="block text-xs font-medium text-on-surface-variant">
        {t("label")}
      </label>
      <select
        id={selectId}
        value={switchingTo ?? currentId}
        disabled={!!switchingTo}
        onChange={(e) => switchTo(e.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:opacity-60"
      >
        {memberships.map((m) => (
          <option key={m.organizationId} value={m.organizationId}>
            {m.organizationStatus === "ACTIVE"
              ? m.organizationName
              : t("optionWithStatus", {
                  name: m.organizationName,
                  status: m.organizationStatus === "PENDING" ? t("statusPending") : t("statusSuspended"),
                })}
          </option>
        ))}
      </select>
      <p className="sr-only" aria-live="polite">
        {switchingTo ? t("switching") : ""}
      </p>
    </div>
  );
}
