"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/formatDate";
import { IntakeForm, type IntakeFormProfile, type IntakeFormInitial } from "./IntakeForm";
import { TreatmentLog, type TreatmentCounts } from "./TreatmentLog";
import { IntakeHistory, type IntakeHistoryEntry } from "./IntakeHistory";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export interface PatientDetailIntake extends IntakeFormInitial {
  id: string;
  admissionDate: string;
  dischargeDate: string | null;
  diagnosis: string | null;
  /** Who recorded the intake; null when that account no longer exists. */
  practitionerName?: string | null;
  treatmentLog: (TreatmentCounts & { id?: string }) | null;
}

interface PatientDetailTabsProps {
  patientId: string;
  patientName: string;
  profile: IntakeFormProfile;
  intakes: PatientDetailIntake[];
  defaultWeightKg: number | null;
  /** The signed-in practitioner, who signs new intakes. */
  doctorName: string;
  /** The organization's plan includes intake PDF export. */
  pdfEnabled: boolean;
}

type TabValue = "intake" | "treatments" | "history";

const TAB_VALUES: TabValue[] = ["intake", "treatments", "history"];

export function PatientDetailTabs({
  patientId,
  patientName,
  profile,
  intakes,
  defaultWeightKg,
  doctorName,
  pdfEnabled,
}: PatientDetailTabsProps) {
  const t = useTranslations("clinical.tabs");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromQuery = searchParams.get("tab");
  const intakeFromQuery = searchParams.get("intake");
  const newFromQuery = searchParams.get("new");

  const tab: TabValue = TAB_VALUES.includes(tabFromQuery as TabValue)
    ? (tabFromQuery as TabValue)
    : "intake";

  const selectedIntake = useMemo(() => {
    if (newFromQuery === "1") return null;
    if (intakeFromQuery) {
      return intakes.find((i) => i.id === intakeFromQuery) ?? intakes[0] ?? null;
    }
    return intakes[0] ?? null;
  }, [intakes, intakeFromQuery, newFromQuery]);

  const updateQuery = useCallback(
    (next: Partial<{ tab: TabValue; intake: string | null; new: string | null }>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.tab) params.set("tab", next.tab);
      if (next.intake !== undefined) {
        if (next.intake) {
          params.set("intake", next.intake);
          params.delete("new");
        } else {
          params.delete("intake");
        }
      }
      if (next.new !== undefined) {
        if (next.new) {
          params.set("new", next.new);
          params.delete("intake");
        } else {
          params.delete("new");
        }
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const historyEntries: IntakeHistoryEntry[] = intakes.map((i) => ({
    id: i.id,
    admissionDate: i.admissionDate,
    dischargeDate: i.dischargeDate,
    diagnosis: i.diagnosis,
    practitionerName: i.practitionerName ?? null,
  }));

  // An existing intake is signed by its author; a new one by the person writing it.
  const intakeDoctor = selectedIntake ? selectedIntake.practitionerName ?? "—" : doctorName;

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => updateQuery({ tab: value as TabValue })}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <TabsList className="group-data-horizontal/tabs:h-10">
          <TabsTrigger value="intake">{t("intake")}</TabsTrigger>
          <TabsTrigger value="treatments">{t("treatments")}</TabsTrigger>
          <TabsTrigger value="history">{t("history")}</TabsTrigger>
        </TabsList>

        {tab === "intake" && (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {selectedIntake && (
              <span className="text-xs text-muted-foreground">
                {formatDate(selectedIntake.admissionDate, locale)} · {patientName}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => updateQuery({ tab: "intake", new: "1", intake: null })}
            >
              <Icon name="add" className="size-4" />
              {t("newIntake")}
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="intake" className="mt-4">
        <IntakeForm
          // A fresh form for each intake (and for a new one), so fields never carry over.
          key={selectedIntake?.id ?? "new"}
          patientId={patientId}
          profile={profile}
          initial={selectedIntake ?? undefined}
          defaultWeightKg={defaultWeightKg}
          doctorName={intakeDoctor}
        />
      </TabsContent>

      <TabsContent value="treatments" className="mt-4">
        {selectedIntake ? (
          <TreatmentLog
            key={selectedIntake.id}
            patientId={patientId}
            intakeId={selectedIntake.id}
            initialCounts={(selectedIntake.treatmentLog ?? {}) as TreatmentCounts}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center text-sm text-muted-foreground">
            {t("saveIntakeFirst")}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <IntakeHistory
          patientId={patientId}
          intakes={historyEntries}
          selectedIntakeId={selectedIntake?.id}
          pdfEnabled={pdfEnabled}
          onSelect={(intakeId) => updateQuery({ tab: "intake", intake: intakeId, new: null })}
        />
      </TabsContent>
    </Tabs>
  );
}
