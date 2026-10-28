import type { IconName } from "@/components/ui/icon";
import type { SessionOrgClaim } from "@/lib/auth.config";

/**
 * Navigation map shared by the desktop sidebar, the mobile bottom bar and the
 * "More" sheet. Labels come from the `nav` namespace (`nav.<key>`).
 *
 * Access is decided from session claims only (src/lib/auth.config.ts): the
 * legacy platform role PRACTITIONER unlocks nothing. Clinical pages open for
 * an ACTIVE organization where the person is OWNER or PRACTITIONER, the same
 * rule the proxy (src/proxy.ts) and the API (src/lib/authz.ts) apply.
 */
export const NAV_ITEMS = {
  dashboard: { href: "/dashboard", icon: "dashboard" },
  calculator: { href: "/calculator", icon: "calculate" },
  history: { href: "/history", icon: "history" },
  family: { href: "/family", icon: "group" },
  recommendations: { href: "/recommendations", icon: "spa" },
  patients: { href: "/patients", icon: "stethoscope" },
  reports: { href: "/reports", icon: "summarize" },
  organization: { href: "/org", icon: "domain" },
  controlCenter: { href: "/admin", icon: "admin_panel_settings" },
  settings: { href: "/settings", icon: "settings" },
  help: { href: "/help", icon: "help" },
} as const satisfies Record<string, { href: string; icon: IconName }>;

export type NavKey = keyof typeof NAV_ITEMS;

export interface ShellAccess {
  isStaff: boolean;
  isSuperadmin: boolean;
  /** Active organization membership from the session claims. */
  org: SessionOrgClaim | null;
  /** Patients and reports are open. */
  isClinical: boolean;
}

export function isClinicalClaim(org: SessionOrgClaim | null | undefined): boolean {
  return !!org && org.orgStatus === "ACTIVE" && (org.role === "OWNER" || org.role === "PRACTITIONER");
}

export function accessFrom(user: { role?: string | null; org?: SessionOrgClaim | null } | null | undefined): ShellAccess {
  const role = user?.role;
  const org = user?.org ?? null;
  return {
    isStaff: role === "ADMIN" || role === "SUPERADMIN",
    isSuperadmin: role === "SUPERADMIN",
    org,
    isClinical: isClinicalClaim(org),
  };
}

export type NavSectionId = "personal" | "organization" | "platform";

export interface NavSection {
  id: NavSectionId;
  items: NavKey[];
}

/** Sidebar sections, in order. Sections without access are left out. */
export function navSections(access: ShellAccess): NavSection[] {
  const sections: NavSection[] = [
    { id: "personal", items: ["dashboard", "calculator", "history", "family", "recommendations"] },
  ];
  if (access.org) {
    sections.push({
      id: "organization",
      items: access.isClinical ? ["patients", "reports", "organization"] : ["organization"],
    });
  }
  if (access.isStaff) sections.push({ id: "platform", items: ["controlCenter"] });
  return sections;
}

/** Account links shown below the sections (sign-out and language sit next to them). */
export const ACCOUNT_ITEMS: readonly NavKey[] = ["settings", "help"];

/** Phone bottom bar: four destinations; the fifth slot opens the "More" sheet. */
export function mobilePrimaryItems(access: ShellAccess): NavKey[] {
  return [
    "dashboard",
    "calculator",
    access.isClinical ? "patients" : "family",
    access.isStaff ? "controlCenter" : "recommendations",
  ];
}

export function isActivePath(pathname: string, href: string): boolean {
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}

export type RoleLabelKey = "superadmin" | "platformAdmin" | "owner" | "manager" | "practitioner" | "personal";

/** The role named on the user card: platform role first, then the active organization role. */
export function roleLabelKey(access: ShellAccess): RoleLabelKey {
  if (access.isSuperadmin) return "superadmin";
  if (access.isStaff) return "platformAdmin";
  switch (access.org?.role) {
    case "OWNER":
      return "owner";
    case "ADMIN":
      return "manager";
    case "PRACTITIONER":
      return "practitioner";
    default:
      return "personal";
  }
}
