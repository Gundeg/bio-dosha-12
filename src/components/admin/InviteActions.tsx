"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Callout, ConfirmDialog } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { linkDelivery, useAdminViewer } from "./AdminViewer";
import { OneTimeLinkDialog, type OneTimeLink } from "./OneTimeLinkDialog";
import type { InviteState, OneTimeLinkResponse } from "./lib";
import { Icon } from "@/components/ui/icon";

/**
 * "New link" and "Revoke" for one invitation. A new link replaces the old one
 * (the old link stops working). Only the superadmin receives the raw link; a
 * platform admin's new link is emailed to the person, so without email
 * delivery the button is off (see InviteLinkNotice). The result is handed to
 * `onLinkCreated` so the list can show it even when the old row leaves a
 * filtered view.
 */
export function InviteActions({
  invite,
  onChanged,
  onLinkCreated,
}: {
  invite: { id: string; email: string; state: InviteState | string };
  onChanged: () => void;
  onLinkCreated: (link: OneTimeLink) => void;
}) {
  const t = useTranslations("admin");
  const viewer = useAdminViewer();
  const delivery = linkDelivery(viewer);
  const [dialog, setDialog] = useState<"renew" | "revoke" | null>(null);

  if (invite.state === "used") return <span className="text-xs text-on-surface-variant">—</span>;

  async function renew() {
    const res = await apiFetch<OneTimeLinkResponse>(`/api/admin/invites/${encodeURIComponent(invite.id)}`, { method: "POST" });
    const url = res.inviteUrl ?? null;
    onLinkCreated({ url, emailSent: res.emailSent, email: invite.email, expiresAt: res.expiresAt });
    if (url || res.emailSent) {
      toast.success(url ? t("inviteActions.renewed") : t("inviteActions.renewedEmailed", { email: invite.email }));
    } else {
      toast.error(t("link.notDeliveredTitle"));
    }
    onChanged();
  }

  async function revoke() {
    await apiFetch(`/api/admin/invites/${encodeURIComponent(invite.id)}`, { method: "DELETE" });
    toast.success(t("inviteActions.revoked", { email: invite.email }));
    onChanged();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        variant="outline"
        size="lg"
        disabled={delivery === "unavailable"}
        title={delivery === "unavailable" ? t("link.adminEmailOff") : undefined}
        onClick={() => setDialog("renew")}
      >
        <Icon name={delivery === "emailed" ? "forward_to_inbox" : "link"} className="size-4" />
        {t("inviteActions.renew")}
        <span className="sr-only">
          : {invite.email}
          {delivery === "unavailable" ? `. ${t("link.adminEmailOff")}` : ""}
        </span>
      </Button>
      {invite.state === "pending" && (
        <Button
          variant="destructive"
          size="lg"
          onClick={() => setDialog("revoke")}
        >
          {t("inviteActions.revoke")}
          <span className="sr-only">: {invite.email}</span>
        </Button>
      )}

      {delivery !== "unavailable" && (
        <ConfirmDialog
          open={dialog === "renew"}
          onOpenChange={(open) => !open && setDialog(null)}
          title={t("inviteActions.renewTitle")}
          description={
            delivery === "shown"
              ? t("inviteActions.renewBody", { email: invite.email })
              : t("inviteActions.renewBodyEmailed", { email: invite.email })
          }
          confirmLabel={delivery === "shown" ? t("inviteActions.renewConfirm") : t("inviteActions.renewConfirmEmailed")}
          onConfirm={renew}
        />
      )}
      <ConfirmDialog
        open={dialog === "revoke"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("inviteActions.revokeTitle")}
        description={t("inviteActions.revokeBody", { email: invite.email })}
        confirmLabel={t("inviteActions.revokeConfirm")}
        tone="danger"
        onConfirm={revoke}
      />
    </div>
  );
}

/**
 * How new invitation links reach people, for the viewer: shown once
 * (superadmin), emailed (platform admin), or unavailable because email
 * delivery is off (platform admin).
 */
export function InviteLinkNotice({ className }: { className?: string }) {
  const t = useTranslations("admin");
  const delivery = linkDelivery(useAdminViewer());
  if (delivery === "unavailable") {
    return (
      <Callout tone="warning" icon="unsubscribe" title={t("link.adminEmailOffTitle")} className={className}>
        {t("link.adminEmailOff")}
      </Callout>
    );
  }
  return (
    <Callout tone="info" icon={delivery === "shown" ? "link" : "forward_to_inbox"} className={className}>
      {delivery === "shown" ? t("invites.howLinksWork") : t("invites.howLinksWorkEmailed")}
    </Callout>
  );
}

/** The one-time link dialog shared by every InviteActions of a list. */
export function InviteLinkDialog({ link, onClose }: { link: OneTimeLink | null; onClose: () => void }) {
  const t = useTranslations("admin");
  return (
    <OneTimeLinkDialog
      link={link}
      onClose={onClose}
      title={t("inviteActions.linkTitle")}
      description={t("inviteActions.linkBody")}
      fieldLabel={t("inviteActions.linkLabel")}
      emailedTitle={t("inviteActions.emailedTitle")}
    />
  );
}
