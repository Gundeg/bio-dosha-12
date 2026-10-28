"use client";

import { useTranslations } from "next-intl";
import { StatusBadge, accountStatusTone, inviteStateTone, orgStatusTone, type BadgeTone } from "@/components/kit";
import { useAdminLabels } from "./hooks";
import type { IconName } from "@/components/ui/icon";

/** Organization status, e.g. "Pending verification". */
export function OrgStatusBadge({ status }: { status: string }) {
  const labels = useAdminLabels();
  return <StatusBadge tone={orgStatusTone(status)}>{labels.orgStatus(status)}</StatusBadge>;
}

export function InviteStateBadge({ state }: { state: string }) {
  const labels = useAdminLabels();
  return <StatusBadge tone={inviteStateTone(state)}>{labels.inviteState(state)}</StatusBadge>;
}

export function AccountStatusBadge({ disabled }: { disabled: boolean }) {
  const t = useTranslations("admin");
  return (
    <StatusBadge tone={accountStatusTone(disabled)}>
      {disabled ? t("statuses.account.disabled") : t("statuses.account.active")}
    </StatusBadge>
  );
}

const ROLE_STYLE: Record<string, { tone: BadgeTone; icon?: IconName }> = {
  SUPERADMIN: { tone: "primary", icon: "shield_person" },
  ADMIN: { tone: "info", icon: "admin_panel_settings" },
};

/** Platform role (Superadmin / Platform admin / User). */
export function RoleBadge({ role }: { role: string }) {
  const labels = useAdminLabels();
  const style = ROLE_STYLE[role] ?? { tone: "neutral" as const };
  return (
    <StatusBadge tone={style.tone} icon={style.icon}>
      {labels.role(role)}
    </StatusBadge>
  );
}

/**
 * 2-step sign-in state. When it is required (staff, organization members) a
 * missing setup is a warning; for individuals it is optional and neutral.
 */
export function MfaBadge({ enabled, required = false }: { enabled: boolean; required?: boolean }) {
  const t = useTranslations("admin");
  if (enabled) {
    return (
      <StatusBadge tone="success" icon="verified_user">
        {t("statuses.mfa.on")}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone={required ? "warning" : "neutral"} icon={required ? "gpp_maybe" : undefined}>
      {t("statuses.mfa.off")}
    </StatusBadge>
  );
}

/** A date or date-time in the app time zone, or a dash / "never". */
export function DateText({
  value,
  withTime = false,
  emptyLabel,
}: {
  value: string | null | undefined;
  withTime?: boolean;
  emptyLabel?: string;
}) {
  const labels = useAdminLabels();
  const tk = useTranslations("kit");
  if (!value) return <span className="text-on-surface-variant">{emptyLabel ?? tk("none")}</span>;
  return (
    <time dateTime={value} className="tabular-nums">
      {withTime ? labels.dateTime(value) : labels.date(value)}
    </time>
  );
}
