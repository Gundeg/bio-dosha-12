import { AdminOverview } from "@/components/admin/AdminOverview";
import { adminPageMetadata } from "./_lib/metadata";

export const generateMetadata = () => adminPageMetadata("nav.overview");

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
