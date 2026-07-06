"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Эмчийн эрхийн хүсэлт хүлээгдэж байгаа хэрэглэгчид самбар дээр нь
 * төлөвийг нь харуулна. Батлагдсаны дараа дахин нэвтрэхийг сануулна.
 */
export function PendingPractitionerBanner() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [state, setState] = useState<"pending" | "approved" | null>(null);

  const isIndividual = session?.user?.role === "INDIVIDUAL";
  const onDashboard = pathname === "/dashboard";

  useEffect(() => {
    if (!isIndividual || !onDashboard) return;
    let cancelled = false;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (cancelled || !me) return;
        if (me.role === "PRACTITIONER" || me.practitionerApprovedAt) {
          setState("approved");
        } else if (me.practitionerRequestedAt) {
          setState("pending");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isIndividual, onDashboard]);

  if (!isIndividual || !onDashboard || !state) return null;

  return (
    <div
      role="status"
      className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
        state === "approved"
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-amber-300/60 bg-amber-50 text-amber-900"
      }`}
    >
      {state === "approved" ? (
        <>
          ✅ Таны эмчийн эрх баталгаажлаа. Эмчийн цэсийг идэвхжүүлэхийн тулд
          гарч, дахин нэвтэрнэ үү.
        </>
      ) : (
        <>
          ⏳ Эмчийн эрхийн хүсэлт админд хүлээгдэж байна. Батлагдмагц энд
          мэдэгдэнэ — энэ хооронд бүх энгийн боломж нээлттэй.
        </>
      )}
    </div>
  );
}
