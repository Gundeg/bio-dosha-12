import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { EmergencyNote } from "@/components/shell/EmergencyNote";
import { OrgStatusBanner } from "@/components/shell/OrgStatusBanner";
import { SessionKeepAlive } from "@/components/shell/SessionKeepAlive";
import { ShellProvider, type ShellUser } from "@/components/shell/ShellProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, tNav, tLegal] = await Promise.all([auth(), getTranslations("nav"), getTranslations("legal")]);

  // Claims from the server render the menu on first paint, before the client
  // session has loaded (no flash of a "personal only" menu).
  const initialUser: ShellUser | null = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
        org: session.user.org ?? null,
      }
    : null;

  return (
    <ShellProvider initialUser={initialUser}>
      <SessionKeepAlive />
      <div className="min-h-screen bg-surface">
        {/* Desktop: sidebar. Phones: bottom bar and menu sheet. */}
        <Sidebar />
        <Navbar />

        <main className="md:ml-60 pt-6 md:pt-10 pb-24 md:pb-12 px-4 sm:px-6 md:px-10 print:m-0 print:p-0">
          <div className="max-w-6xl mx-auto print:max-w-none">
            <div className="print:hidden">
              <OrgStatusBanner />
            </div>
            {children}

            <footer className="mt-12 flex flex-col gap-2 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <EmergencyNote />
              <p className="flex gap-4 text-xs text-on-surface-variant">
                <Link href="/about" className="rounded-sm hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
                  {tNav("about")}
                </Link>
                <Link href="/privacy" className="rounded-sm hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
                  {tLegal("privacyLink")}
                </Link>
              </p>
            </footer>
          </div>
        </main>
      </div>
    </ShellProvider>
  );
}
