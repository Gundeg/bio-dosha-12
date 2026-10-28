"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PractitionerItem {
  id: string;
  name: string;
  email: string;
  approvedAt: string | null;
}

/** Approved practitioners, with a way to revoke access. */
export function PractitionerAccessList({ practitioners }: { practitioners: PractitionerItem[] }) {
  const t = useTranslations("admin.access");
  const locale = useLocale();
  const router = useRouter();
  const [target, setTarget] = useState<PractitionerItem | null>(null);
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (!target) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/practitioner-requests/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "revoke" }),
      });
      toast.success(t("revoked", { name: target.name }));
      setTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("error"));
    } finally {
      setBusy(false);
    }
  }

  if (practitioners.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {practitioners.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <div className="flex-1 min-w-48">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.email}</p>
                {p.approvedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("approvedAt", { date: formatDate(p.approvedAt, locale) })}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setTarget(p)}>
                {t("revoke")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!target} onOpenChange={(open) => { if (!open) setTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirmBody", { name: target?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={revoke} disabled={busy}>
              {busy ? t("revoking") : t("revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
