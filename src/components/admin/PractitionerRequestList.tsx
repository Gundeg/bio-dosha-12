"use client";

import { useState } from "react";
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
        toast.error(data.error ?? "Алдаа гарлаа. Дахин оролдоно уу.");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success(
        action === "approve"
          ? "Эмчийн эрх нээгдлээ. Хэрэглэгч дахин нэвтэрснээр эмчийн цэс идэвхжинэ."
          : "Хүсэлтийг татгалзлаа."
      );
    } catch {
      toast.error("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Хүлээгдэж буй хүсэлт алга. Шинэ хүсэлт ирэхэд энд харагдана.
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
                Хүсэлт илгээсэн: {new Date(r.requestedAt).toLocaleDateString("mn-MN")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === r.id}
                onClick={() => act(r.id, "approve")}
              >
                Батлах
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => act(r.id, "reject")}
              >
                Татгалзах
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
