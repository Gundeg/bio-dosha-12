import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { PendingPractitionerBanner } from "@/components/PendingPractitionerBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Glass top bar (desktop: user util strip; mobile: full nav) */}
      <Navbar />

      {/* Main content — offset by sidebar on desktop */}
      {/* Phones have no top bar (navigation sits at the bottom), so only desktop needs the top offset. */}
      <main className="md:ml-64 pt-6 md:pt-24 pb-28 md:pb-10 px-4 sm:px-6 md:px-10 print:m-0 print:p-0">
        <div className="max-w-6xl mx-auto print:max-w-none">
          <div className="print:hidden">
            <PendingPractitionerBanner />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
