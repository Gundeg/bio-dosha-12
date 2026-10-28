import { Suspense } from "react";
import { OrganizationsList } from "@/components/admin/OrganizationsList";
import { PageSkeleton } from "@/components/admin/AdminStates";
import { adminPageMetadata } from "../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("nav.organizations");

export default function AdminOrganizationsPage() {
  // The list reads its filter from the URL (?status=PENDING).
  return (
    <Suspense fallback={<PageSkeleton sections={1} />}>
      <OrganizationsList />
    </Suspense>
  );
}
