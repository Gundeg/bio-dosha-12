"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/kit/layout";
import { AuthShell } from "./AuthShell";
import { ButtonSpinner, PRIMARY_BUTTON_CLASS, PrimaryButton } from "./fields";
import { navigateAfterAuth, signOutHere } from "./session";

/**
 * Shown on the sign-in and sign-up pages to someone who is already signed in,
 * so a shared computer can change accounts (for example a doctor's personal
 * account and the clinic account) without hunting for the menu.
 */
export function AlreadySignedIn({ email, next }: { email: string | null; next: string | null }) {
  const t = useTranslations("authFlows.signedIn");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function switchAccount() {
    setBusy(true);
    setFailed(false);
    // On success the browser is already leaving for the sign-in page.
    if (await signOutHere()) return;
    setBusy(false);
    setFailed(true);
  }

  return (
    <AuthShell
      icon="account_circle"
      title={t("title")}
      description={email ? t("subtitle", { email }) : t("subtitleNoEmail")}
    >
      <div className="space-y-3">
        {failed && <Callout tone="danger">{t("signOutFailed")}</Callout>}
        <PrimaryButton type="button" onClick={() => navigateAfterAuth(next ?? "/")}>
          {t("continue")}
        </PrimaryButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => void switchAccount()}
          disabled={busy}
          aria-busy={busy || undefined}
          className={PRIMARY_BUTTON_CLASS}
        >
          {busy ? (
            <>
              <ButtonSpinner />
              {t("switching")}
            </>
          ) : (
            t("switch")
          )}
        </Button>
        <p className="text-xs text-on-surface-variant">{t("hint")}</p>
      </div>
    </AuthShell>
  );
}
