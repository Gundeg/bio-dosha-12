"use client";

import { createContext, useContext } from "react";

/**
 * The signed-in staff member, resolved on the server by the admin layout
 * (getAuthContext reads role and status from the database). Pages use it to
 * hide actions the viewer may not take; every API route checks again.
 */
export interface AdminViewer {
  id: string;
  email: string;
  role: "ADMIN" | "SUPERADMIN";
  isSuperadmin: boolean;
  /** Email delivery is configured (same check as GET /api/me → emailEnabled). */
  emailEnabled: boolean;
}

/**
 * Who receives the raw one-time links (password reset, new invitation link).
 * Only the superadmin sees them; a platform admin's links are emailed to the
 * person, so without email delivery a platform admin cannot create them.
 */
export function linkDelivery(viewer: AdminViewer): "shown" | "emailed" | "unavailable" {
  if (viewer.isSuperadmin) return "shown";
  return viewer.emailEnabled ? "emailed" : "unavailable";
}

const AdminViewerContext = createContext<AdminViewer | null>(null);

export function AdminViewerProvider({ viewer, children }: { viewer: AdminViewer; children: React.ReactNode }) {
  return <AdminViewerContext.Provider value={viewer}>{children}</AdminViewerContext.Provider>;
}

export function useAdminViewer(): AdminViewer {
  const viewer = useContext(AdminViewerContext);
  if (!viewer) throw new Error("useAdminViewer must be used inside the control-center layout.");
  return viewer;
}
