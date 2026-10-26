"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

export interface IntakeHistoryEntry {
  id: string;
  admissionDate: string;
  dischargeDate: string | null;
  diagnosis: string | null;
}

interface IntakeHistoryProps {
  patientId: string;
  intakes: IntakeHistoryEntry[];
  selectedIntakeId?: string;
  onSelect: (intakeId: string) => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function IntakeHistory({
  patientId,
  intakes,
  selectedIntakeId,
  onSelect,
}: IntakeHistoryProps) {
  const t = useTranslations("clinical.history");

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
                  {formatDate(intake.admissionDate)}
                  {intake.dischargeDate && (
                    <span className="text-muted-foreground">
                      {" → "}
                      {formatDate(intake.dischargeDate)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {intake.diagnosis ?? t("noDiagnosis")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-current={active ? "true" : undefined}
                onClick={() => onSelect(intake.id)}
              >
                {active ? t("active") : t("view")}
              </Button>
              <Link
                href={`/api/patients/${patientId}/intakes/${intake.id}/pdf`}
                target="_blank"
                rel="noopener"
                aria-label={t("pdfLabel", { date: formatDate(intake.admissionDate) })}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("pdf")}
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
