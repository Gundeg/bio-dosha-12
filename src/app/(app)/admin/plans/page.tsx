import { PlansOverview } from "@/components/admin/PlansOverview";
import { adminPageMetadata } from "../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("nav.plans");

export default function AdminPlansPage() {
  return <PlansOverview />;
}
