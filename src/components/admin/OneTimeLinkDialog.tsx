"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Callout, CopyField } from "@/components/kit";
import { useAdminLabels } from "./hooks";

export interface OneTimeLink {
  /** null when the link was only emailed and staff never see it. */
  url: string | null;
  emailSent: boolean;
  /** Who the link is for (shown in the email note). */
  email: string;
  expiresAt?: string;
}

/**
 * Result of creating an invitation or password-reset link. With a raw link
 * (superadmin, organization owner invites) it is shown once in a CopyField;
 * otherwise the dialog confirms the email, or says plainly that it failed.
 * The link lives only in component state and is dropped when the dialog closes.
 */
export function OneTimeLinkDialog({
  link,
  onClose,
  title,
  description,
  fieldLabel,
  emailedTitle,
  children,
}: {
  link: OneTimeLink | null;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  fieldLabel: React.ReactNode;
  /** Title when the link was emailed instead of shown. */
  emailedTitle: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const labels = useAdminLabels();
  const emailedOnly = link !== null && !link.url;
  const until = link?.expiresAt ? (labels.dateTime(link.expiresAt) ?? "") : "";

  return (
    <Dialog open={!!link} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg font-bold">
            {emailedOnly ? (link.emailSent ? emailedTitle : t("link.notDeliveredTitle")) : title}
          </DialogTitle>
          {!emailedOnly && description && <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription>}
        </DialogHeader>
        {link && (
          <div className="space-y-4" aria-live="polite">
            {emailedOnly ? (
              link.emailSent ? (
                <Callout tone="success" icon="mark_email_read" title={t("link.emailedOnly", { email: link.email })}>
                  {until ? t("link.emailedOnlyHint", { date: until }) : t("link.emailedOnlyHintNoDate")}
                </Callout>
              ) : (
                <Callout tone="danger" icon="unsubscribe" title={t("link.notDeliveredTitle")}>
                  {t("link.notDeliveredBody", { email: link.email })}
                </Callout>
              )
            ) : (
              <>
                {link.emailSent ? (
                  <Callout tone="success" icon="mark_email_read">
                    {t("link.emailSent", { email: link.email })}
                  </Callout>
                ) : (
                  <Callout tone="info" icon="unsubscribe">
                    {t("link.emailNotSent", { email: link.email })}
                  </Callout>
                )}
                <CopyField
                  label={fieldLabel}
                  value={link.url ?? ""}
                  note={until ? `${t("link.validUntil", { date: until })} ${tk("shownOnce")}` : undefined}
                />
                {children}
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button className="h-10 px-4 font-semibold" onClick={onClose}>
            {t("common.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
