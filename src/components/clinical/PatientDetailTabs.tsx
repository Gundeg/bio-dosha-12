"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntakeForm, type IntakeFormProfile, type IntakeFormInitial } from "./IntakeForm";
import { TreatmentLog, type TreatmentCounts } from "./TreatmentLog";
import { IntakeHistory, type IntakeHistoryEntry } from "./IntakeHistory";
import { Button } from "@/components/ui/button";

export interface PatientDetailIntake extends IntakeFormInitial {
  id: string;
  admissionDate: string;
  dischargeDate: string | null;
  diagnosis: string | null;
  treatmentLog: (TreatmentCounts & { id?: string }) | null;
}

interface PatientDetailTabsProps {
  patientId: string;
  patientName: string;
  profile: IntakeFormProfile;
  intakes: PatientDetailIntake[];
  defaultWeightKg: number | null;
  doctorName: string;
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
}: PatientDetailTabsProps) {
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
  }));

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => updateQuery({ tab: value as TabValue })}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <TabsList>
          <TabsTrigger value="intake">Үзлэгийн карт</TabsTrigger>
          <TabsTrigger value="treatments">Эмчилгээ</TabsTrigger>
          <TabsTrigger value="history">Түүх</TabsTrigger>
        </TabsList>

        {tab === "intake" && (
          <div className="flex items-center gap-2">
            {selectedIntake && (
              <span className="text-xs text-muted-foreground">
                {selectedIntake.admissionDate.slice(0, 10)} • {patientName}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateQuery({ tab: "intake", new: "1", intake: null })}
            >
              + Шинэ үзлэг
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="intake" className="mt-4">
        <IntakeForm
          patientId={patientId}
          profile={profile}
          initial={selectedIntake ?? undefined}
          defaultWeightKg={defaultWeightKg}
          doctorName={doctorName}
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
          <div className="rounded-lg border border-dashed border-input p-10 text-center text-sm text-muted-foreground">
            Эмчилгээний хуваарь оруулахын тулд эхлээд үзлэгийн карт хадгалаарай.
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <IntakeHistory
          patientId={patientId}
          intakes={historyEntries}
          selectedIntakeId={selectedIntake?.id}
          onSelect={(intakeId) => updateQuery({ tab: "intake", intake: intakeId, new: null })}
        />
      </TabsContent>
    </Tabs>
  );
}
