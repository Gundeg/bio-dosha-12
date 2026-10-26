import { UserDetail } from "@/components/admin/UserDetail";
import { adminPageMetadata } from "../../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("user.titleFallback");

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserDetail key={userId} userId={userId} />;
}
