"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { THERAPY_GROUPS, TREATMENT_MAX_SESSIONS, ALL_THERAPY_KEYS } from "@/lib/clinicalConstants";
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
    fetch(`/api/patients/${patientId}/intakes/${intakeId}/treatments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
      })
      .catch(() => {
        toast.error("Хадгалах амжилтгүй боллоо.");
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
    setCounts((prev) => {
      const current = prev[key] ?? 0;
      const nextValue = current === n ? n - 1 : n;
      const safe = Math.max(0, Math.min(TREATMENT_MAX_SESSIONS, nextValue));
      const next = { ...prev, [key]: safe };
      scheduleSave({ [key]: safe });
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Эмчилгээний хуваарь</CardTitle>
        <span className="text-xs text-muted-foreground">
          {saving ? "Хадгалж байна..." : "Автоматаар хадгалагдана"}
        </span>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-input text-muted-foreground">
              <th className="w-10 px-2 py-2 text-left font-medium">№</th>
              <th className="w-48 px-2 py-2 text-left font-medium">Эмчилгээний нэрс</th>
              <th className="w-40 px-2 py-2 text-left font-medium"></th>
              <th className="px-2 py-2 text-left font-medium">Сесс (1–10)</th>
              <th className="w-16 px-2 py-2 text-right font-medium">Нийт</th>
            </tr>
          </thead>
          <tbody>
            {THERAPY_GROUPS.map((group) => {
              const groupTotal = group.leaves.reduce(
                (sum, leaf) => sum + (counts[leaf.key] ?? 0),
                0
              );
              return group.leaves.map((leaf, idx) => {
                const value = counts[leaf.key] ?? 0;
                const showGroupHeader = idx === 0;
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
                        {group.label}
                      </td>
                    )}
                    <td className="px-2 py-2 text-muted-foreground">
                      {group.leaves.length === 1 && leaf.label === group.label ? "" : leaf.label}
                    </td>
                    <td className="px-2 py-2">
                      <CounterCells value={value} onSet={(n) => setCellCount(leaf.key, n)} />
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {showGroupHeader && group.leaves.length > 1 ? (
                        <span className="text-xs text-muted-foreground">
                          {value}{" "}
                          <span className="opacity-60">/ {groupTotal}</span>
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

function CounterCells({ value, onSet }: { value: number; onSet: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: TREATMENT_MAX_SESSIONS }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSet(n)}
            aria-label={`Сесс ${n}`}
            className={`w-6 h-6 rounded text-[10px] border transition-colors ${
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
