import { SystemStatus } from "@/components/admin/SystemStatus";
import { adminPageMetadata } from "../_lib/metadata";

export const generateMetadata = () => adminPageMetadata("nav.system");

export default function AdminSystemPage() {
  return <SystemStatus />;
}
