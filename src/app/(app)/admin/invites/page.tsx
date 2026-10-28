import { Suspense } from "react";
import { InvitesList } from "@/components/admin/InvitesList";
import { PageSkeleton } from "@/components/admin/AdminStates";
import { adminPageMetadata } from "../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("nav.invites");

export default function AdminInvitesPage() {
  // The list reads its filters from the URL (?kind=staff, ?state=pending).
  return (
    <Suspense fallback={<PageSkeleton sections={1} />}>
      <InvitesList />
    </Suspense>
  );
}
