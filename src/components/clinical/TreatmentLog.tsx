"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { THERAPY_GROUPS, TREATMENT_MAX_SESSIONS, ALL_THERAPY_KEYS } from "@/lib/clinicalConstants";
import { apiFetch } from "@/lib/api";
import { useErrorMessage } from "@/components/kit/hooks";
import { toast } from "sonner";

export type TreatmentCounts = Record<string, number>;

interface TreatmentLogProps {
  patientId: string;
  intakeId: string;
  initialCounts: TreatmentCounts;
}

const DEBOUNCE_MS = 500;

function buildEmptyCounts(): TreatmentCounts {
  return Object.fromEntries(ALL_THERAPY_KEYS.map((k) => [k, 0]));
}

export function TreatmentLog({ patientId, intakeId, initialCounts }: TreatmentLogProps) {
  const t = useTranslations("clinical.treatment");
  const errorMessage = useErrorMessage();
  const [counts, setCounts] = useState<TreatmentCounts>(() => ({
    ...buildEmptyCounts(),
    ...initialCounts,
  }));
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef<TreatmentCounts | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flush() {
    if (!dirtyRef.current) return;
    const payload = dirtyRef.current;
    dirtyRef.current = null;
    setSaving(true);
    apiFetch(`/api/patients/${patientId}/intakes/${intakeId}/treatments`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
      .catch((err) => {
        toast.error(t("saveError"), { description: errorMessage(err) });
      })
      .finally(() => setSaving(false));
  }

  function scheduleSave(next: TreatmentCounts) {
    dirtyRef.current = { ...(dirtyRef.current ?? {}), ...next };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCellCount(key: string, n: number) {
    // Compute from the rendered state and schedule the save outside the state
    // updater: updaters must stay pure, and StrictMode runs them twice.
    const current = counts[key] ?? 0;
    const nextValue = current === n ? n - 1 : n;
    const safe = Math.max(0, Math.min(TREATMENT_MAX_SESSIONS, nextValue));
    setCounts((prev) => ({ ...prev, [key]: safe }));
    scheduleSave({ [key]: safe });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {saving ? t("saving") : t("autoSave")}
        </span>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-input text-muted-foreground">
              <th scope="col" className="w-10 px-2 py-2 text-left font-medium">{t("number")}</th>
              <th scope="col" className="w-48 px-2 py-2 text-left font-medium">{t("therapyNames")}</th>
              <th scope="col" className="w-40 px-2 py-2 text-left font-medium">
                <span className="sr-only">{t("subtype")}</span>
              </th>
              <th scope="col" className="px-2 py-2 text-left font-medium">
                {t("sessions", { max: TREATMENT_MAX_SESSIONS })}
              </th>
              <th scope="col" className="w-16 px-2 py-2 text-right font-medium">{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {THERAPY_GROUPS.map((group) => {
              const groupLabel = t(`groups.group${group.number}`);
              const groupTotal = group.leaves.reduce(
                (sum, leaf) => sum + (counts[leaf.key] ?? 0),
                0
              );
              return group.leaves.map((leaf, idx) => {
                const value = counts[leaf.key] ?? 0;
                const showGroupHeader = idx === 0;
                const isSingle = group.leaves.length === 1 && leaf.label === group.label;
                const leafLabel = t(`leaves.${leaf.key}`);
                const therapyName = isSingle ? groupLabel : `${groupLabel} — ${leafLabel}`;
                return (
                  <tr key={leaf.key} className="border-b border-input/50">
                    {showGroupHeader && (
                      <td
                        className="px-2 py-2 align-top font-medium"
                        rowSpan={group.leaves.length}
                      >
                        {group.number}
                      </td>
                    )}
                    {showGroupHeader && (
                      <td
                        className="px-2 py-2 align-top font-medium"
                        rowSpan={group.leaves.length}
                      >
                        {groupLabel}
                      </td>
                    )}
                    <td className="px-2 py-2 text-muted-foreground">
                      {isSingle ? "" : leafLabel}
                    </td>
                    <td className="px-2 py-2">
                      <CounterCells
                        value={value}
                        onSet={(n) => setCellCount(leaf.key, n)}
                        labelFor={(n) => t("sessionButton", { therapy: therapyName, n })}
                      />
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {showGroupHeader && group.leaves.length > 1 ? (
                        <span className="text-xs text-muted-foreground">
                          {value}{" "}
                          <span>/ {groupTotal}</span>
                        </span>
                      ) : (
                        <span className="text-xs">{value}</span>
                      )}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CounterCells({
  value,
  onSet,
  labelFor,
}: {
  value: number;
  onSet: (n: number) => void;
  labelFor: (n: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: TREATMENT_MAX_SESSIONS }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSet(n)}
            aria-label={labelFor(n)}
            aria-pressed={filled}
            className={`size-8 rounded-md text-xs font-medium border transition-colors ${
              filled
                ? "bg-primary text-on-primary border-primary"
                : "bg-transparent border-input hover:bg-muted"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
