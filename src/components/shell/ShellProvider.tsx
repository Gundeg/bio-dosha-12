"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import type { SessionOrgClaim } from "@/lib/auth.config";
import { accessFrom, roleLabelKey, type ShellAccess } from "./nav";

/** The part of the session the app shell needs. */
export interface ShellUser {
  name: string | null;
  email: string | null;
  role: string;
  org: SessionOrgClaim | null;
}

/** One organization membership as GET /api/me returns it. */
export interface ShellMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationStatus: SessionOrgClaim["orgStatus"];
  role: SessionOrgClaim["role"];
  status: string;
}

interface ShellValue {
  user: ShellUser | null;
  access: ShellAccess;
  /** Active memberships, loaded lazily from GET /api/me; null until loaded and for people without one. */
  memberships: ShellMembership[] | null;
  /** The membership of the organization named in the session claims, once loaded. */
  activeMembership: ShellMembership | null;
}

const ShellContext = createContext<ShellValue | null>(null);

/**
 * Shares who is signed in and their organizations with the sidebar, the
 * mobile navigation, the organization banner and the clinical pages.
 *
 * Access always comes from the session claims (the same claims the proxy routes
 * with). GET /api/me only adds organization names and the membership list for
 * the switcher; it is requested only for organization members and again when
 * the active organization changes.
 */
export function ShellProvider({
  initialUser,
  children,
}: {
  /** Claims read on the server, used until the client session has loaded. */
  initialUser: ShellUser | null;
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const sessionUser = session?.user;

  const user = useMemo<ShellUser | null>(() => {
    if (sessionUser) {
      return {
        name: sessionUser.name ?? null,
        email: sessionUser.email ?? null,
        role: sessionUser.role,
        org: sessionUser.org ?? null,
      };
    }
    return status === "loading" ? initialUser : null;
  }, [sessionUser, status, initialUser]);

  const org = user?.org ?? null;
  const orgKey = org ? `${org.id}|${org.role}|${org.orgStatus}` : null;
  const [loaded, setLoaded] = useState<ShellMembership[] | null>(null);

  useEffect(() => {
    if (!orgKey) return;
    let cancelled = false;
    apiFetch<{ memberships: ShellMembership[] }>("/api/me")
      .then((me) => {
        if (!cancelled) setLoaded(me.memberships.filter((m) => m.status === "ACTIVE"));
      })
      .catch(() => {
        // Names and the switcher are extras: without them the shell keeps
        // working from the session claims, so a failed request changes nothing.
      });
    return () => {
      cancelled = true;
    };
  }, [orgKey]);

  const value = useMemo<ShellValue>(() => {
    const memberships = orgKey ? loaded : null;
    return {
      user,
      access: accessFrom(user),
      memberships,
      activeMembership: memberships?.find((m) => m.organizationId === org?.id) ?? null,
    };
  }, [user, orgKey, loaded, org?.id]);

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellValue {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell() must be used inside <ShellProvider> (the (app) layout).");
  return value;
}

/** "Superadmin", "Platform admin", "Owner · Clinic", … or "Personal account". */
export function useRoleLabel(): string {
  const { access, activeMembership } = useShell();
  const t = useTranslations("nav");
  const key = roleLabelKey(access);
  const role = t(key);
  const orgName = activeMembership?.organizationName;
  const isOrgRole = key === "owner" || key === "manager" || key === "practitioner";
  return isOrgRole && orgName ? t("roleWithOrg", { role, org: orgName }) : role;
}
