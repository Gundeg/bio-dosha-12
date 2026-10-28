"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { OrgRole } from "@/components/settings/types";
import { ROLE_CHOICES } from "./types";

/**
 * Role choice as radio cards with a plain-language description of each role,
 * so nobody has to guess what "manager" means. Disabled choices say why.
 */
export function RolePicker({
  name,
  value,
  onChange,
  legend,
  disabledRoles = {},
  disabled,
}: {
  /** Radio group name (unique on the page). */
  name: string;
  value: OrgRole;
  onChange: (role: OrgRole) => void;
  legend: string;
  /** Role → reason it cannot be chosen. */
  disabledRoles?: Partial<Record<OrgRole, string>>;
  disabled?: boolean;
}) {
  const t = useTranslations("org.roles");
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-2">
      <legend className="mb-1.5 text-sm font-medium text-on-surface">{legend}</legend>
      {ROLE_CHOICES.map((role) => {
        const reason = disabledRoles[role];
        const id = `${name}-${role}`;
        return (
          <label
            key={role}
            htmlFor={id}
            className={cn(
              "flex items-start gap-3 rounded-lg px-4 py-3 ring-1 ring-outline-variant transition",
              "has-checked:bg-primary/5 has-checked:ring-2 has-checked:ring-primary",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
              reason || disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-surface-container-low"
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={role}
              checked={value === role}
              disabled={!!reason}
              onChange={() => onChange(role)}
              aria-describedby={`${id}-desc`}
              className="mt-1 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-on-surface">{t(`${role}.label`)}</span>
              <span id={`${id}-desc`} className="block text-sm text-on-surface-variant">
                {t(`${role}.description`)}
                {reason && <span className="mt-0.5 block text-xs font-medium text-on-surface">{reason}</span>}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
