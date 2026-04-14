import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Glass top bar (desktop: user util strip; mobile: full nav) */}
      <Navbar />

      {/* Main content — offset by sidebar on desktop */}
      <main className="md:ml-64 pt-24 pb-28 md:pb-10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
