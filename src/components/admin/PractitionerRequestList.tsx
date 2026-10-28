"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RequestItem {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
}

export function PractitionerRequestList({
  initialRequests,
}: {
  initialRequests: RequestItem[];
}) {
  const t = useTranslations("admin.requests");
  const locale = useLocale();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/practitioner-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? t("error"));
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success(
        action === "approve" ? t("approved") : t("rejected")
      );
    } catch {
      toast.error(t("networkError"));
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <div className="flex-1 min-w-48">
              <p className="font-semibold">{r.name}</p>
              <p className="text-sm text-muted-foreground">{r.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("requestedAt", { date: formatDate(r.requestedAt, locale) })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === r.id}
                onClick={() => act(r.id, "approve")}
              >
                {t("approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => act(r.id, "reject")}
              >
                {t("reject")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
