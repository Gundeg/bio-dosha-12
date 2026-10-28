"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Callout, DescriptionList, Section, StatusBadge } from "@/components/kit";
import { formatDate } from "@/lib/formatDate";
import { RecoveryCodesDialog } from "./RecoveryCodesDialog";
import { DisableTwoStepDialog } from "./DisableTwoStepDialog";
import { mfaSetupHref, type Me } from "./types";
import { Icon } from "@/components/ui/icon";

/** Recovery codes issued at setup; fewer than this left earns a warning. */
const RECOVERY_CODES_TOTAL = 10;
const LOW_CODES = 2;

export function TwoStepSection({ me, reload }: { me: Me; reload: () => void }) {
  const t = useTranslations("settings.twoStep");
  const locale = useLocale();
  const [dialog, setDialog] = useState<"recovery" | "disable" | null>(null);
  const { enabled, enabledAt, required, recoveryCodesLeft } = me.mfa;

  return (
    <Section
      title={t("title")}
      description={t("description")}
      actions={
        enabled ? (
          <StatusBadge tone="success" icon="verified_user">
            {t("on")}
          </StatusBadge>
        ) : (
          <StatusBadge tone={required ? "warning" : "neutral"} icon="gpp_maybe">
            {t("off")}
          </StatusBadge>
        )
      }
    >
      <div className="space-y-5">
        {required && (
          <Callout tone="info" icon="admin_panel_settings" title={t("requiredTitle")}>
            {t("requiredBody")}
          </Callout>
        )}

        {enabled ? (
          <>
            <DescriptionList
              items={[
                { label: t("enabledOn"), value: enabledAt ? formatDate(enabledAt, locale, "long") : "—" },
                {
                  label: t("codesLeft"),
                  value: t("codesLeftValue", { count: recoveryCodesLeft, total: RECOVERY_CODES_TOTAL }),
                },
              ]}
            />
            {recoveryCodesLeft <= LOW_CODES && (
              <Callout tone="warning" title={recoveryCodesLeft === 0 ? t("noCodesTitle") : t("lowCodesTitle", { count: recoveryCodesLeft })}>
                {t("lowCodesBody")}
              </Callout>
            )}
            <p className="text-sm text-on-surface-variant">{t("recoveryExplain")}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button variant="outline" size="lg" onClick={() => setDialog("recovery")}>
                <Icon name="key" className="size-4" />
                {t("newCodes")}
              </Button>
              {!required && (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setDialog("disable")}
                >
                  {t("turnOff")}
                </Button>
              )}
            </div>
            {required && <p className="text-sm text-on-surface-variant">{t("cannotTurnOff")}</p>}
          </>
        ) : (
          <>
            <p className="text-sm text-on-surface">{t("offBody")}</p>
            <ButtonLink href={mfaSetupHref("/settings?tab=security")} size="lg">
              <Icon name="phonelink_lock" className="size-4" />
              {t("turnOn")}
            </ButtonLink>
          </>
        )}
      </div>

      <RecoveryCodesDialog
        open={dialog === "recovery"}
        onOpenChange={(open) => setDialog(open ? "recovery" : null)}
        email={me.email}
        onCreated={reload}
      />
      {!required && (
        <DisableTwoStepDialog
          open={dialog === "disable"}
          onOpenChange={(open) => setDialog(open ? "disable" : null)}
          onDisabled={reload}
        />
      )}
    </Section>
  );
}
