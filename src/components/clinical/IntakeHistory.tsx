"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  if (intakes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Үзлэгийн түүх байхгүй байна.
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
                  {intake.diagnosis ?? "Онош тэмдэглээгүй"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect(intake.id)}
              >
                {active ? "Идэвхтэй" : "Үзэх"}
              </Button>
              <Link
                href={`/api/patients/${patientId}/intakes/${intake.id}/pdf`}
                target="_blank"
                rel="noopener"
              >
                <Button variant="outline" size="sm">
                  PDF
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
