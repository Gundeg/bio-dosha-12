import { Suspense } from "react";
import { AuditLog } from "@/components/admin/AuditLog";
import { PageSkeleton } from "@/components/admin/AdminStates";
import { adminPageMetadata } from "../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("nav.audit");

export default function AdminAuditPage() {
  // Links from other pages pre-fill the filters (?actor=…, ?organizationId=…).
  return (
    <Suspense fallback={<PageSkeleton sections={2} />}>
      <AuditLog />
    </Suspense>
  );
}
