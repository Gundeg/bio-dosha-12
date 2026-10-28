"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/kit/layout";
import { formatDate } from "@/lib/formatDate";

export interface IntakeHistoryEntry {
  id: string;
  admissionDate: string;
  dischargeDate: string | null;
  diagnosis: string | null;
  practitionerName: string | null;
}

interface IntakeHistoryProps {
  patientId: string;
  intakes: IntakeHistoryEntry[];
  selectedIntakeId?: string;
  /** The organization's plan includes intake PDF export. */
  pdfEnabled: boolean;
  onSelect: (intakeId: string) => void;
}

export function IntakeHistory({
  patientId,
  intakes,
  selectedIntakeId,
  pdfEnabled,
  onSelect,
}: IntakeHistoryProps) {
  const t = useTranslations("clinical.history");
  const locale = useLocale();
  const date = (value: string | null) => (value ? formatDate(value, locale) : "—");

  if (intakes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {!pdfEnabled && (
        <Callout tone="info" icon="picture_as_pdf" title={t("pdfUnavailableTitle")}>
          {t("pdfUnavailable")}
        </Callout>
      )}
      {intakes.map((intake) => {
        const active = intake.id === selectedIntakeId;
        return (
          <Card
            key={intake.id}
            className={active ? "ring-2 ring-primary/40" : undefined}
          >
            <CardContent className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[12rem]">
                <p className="text-sm font-medium">
                  {date(intake.admissionDate)}
                  {intake.dischargeDate && (
                    <span className="text-muted-foreground">
                      {" – "}
                      {date(intake.dischargeDate)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {intake.diagnosis ?? t("noDiagnosis")}
                </p>
                {intake.practitionerName && (
                  <p className="text-xs text-muted-foreground">
                    {t("recordedBy", { name: intake.practitionerName })}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="lg"
                className="px-3"
                aria-current={active ? "true" : undefined}
                onClick={() => onSelect(intake.id)}
              >
                {active ? t("active") : t("view")}
              </Button>
              {pdfEnabled && (
                // A plain link: next/link would prefetch the route handler, which
                // renders the PDF and writes an "exported" audit entry.
                <a
                  href={`/api/patients/${patientId}/intakes/${intake.id}/pdf`}
                  target="_blank"
                  rel="noopener"
                  aria-label={t("pdfLabel", { date: date(intake.admissionDate) })}
                  className={buttonVariants({ variant: "outline", size: "lg", className: "px-3" })}
                >
                  {t("pdf")}
                </a>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
