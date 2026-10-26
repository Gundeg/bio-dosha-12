import { Suspense } from "react";
import { UsersList } from "@/components/admin/UsersList";
import { PageSkeleton } from "@/components/admin/AdminStates";
import { adminPageMetadata } from "../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("nav.users");

export default function AdminUsersPage() {
  // The list reads its filters from the URL (?type=staff, ?status=disabled).
  return (
    <Suspense fallback={<PageSkeleton sections={1} />}>
      <UsersList />
    </Suspense>
  );
}
