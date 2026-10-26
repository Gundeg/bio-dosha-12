import { OrganizationDetail } from "@/components/admin/OrganizationDetail";
import { adminPageMetadata } from "../../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("org.titleFallback");

export default async function AdminOrganizationPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <OrganizationDetail key={orgId} orgId={orgId} />;
}
