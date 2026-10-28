"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  PULSE_COL_KEYS,
  PULSE_ROW_KEYS,
  type PulseColKey,
  type PulseRowKey,
} from "@/lib/clinicalConstants";
import type { PulseTable as PulseTableValue } from "@/lib/apiSchemas";

interface PulseTableProps {
  value: PulseTableValue;
  onChange: (next: PulseTableValue) => void;
  disabled?: boolean;
}

export function PulseTable({ value, onChange, disabled }: PulseTableProps) {
  const t = useTranslations("clinical.pulse");

  function update(row: PulseRowKey, col: PulseColKey, next: string) {
    onChange({
      ...value,
      [row]: { ...value[row], [col]: next },
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-input">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th scope="col" className="w-24 px-3 py-2 text-left font-medium" rowSpan={2}>
              {t("finger")}
            </th>
            <th scope="colgroup" className="px-3 py-2 text-center font-medium" colSpan={2}>
              {t("rightHand")}
            </th>
            <th scope="colgroup" className="px-3 py-2 text-center font-medium" colSpan={2}>
              {t("leftHand")}
            </th>
          </tr>
          <tr className="bg-muted/50 text-muted-foreground">
            <th scope="col" className="px-3 py-2 text-center font-normal">{t("upper")}</th>
            <th scope="col" className="px-3 py-2 text-center font-normal">{t("lower")}</th>
            <th scope="col" className="px-3 py-2 text-center font-normal">{t("upper")}</th>
            <th scope="col" className="px-3 py-2 text-center font-normal">{t("lower")}</th>
          </tr>
        </thead>
        <tbody>
          {PULSE_ROW_KEYS.map((row) => (
            <tr key={row} className="border-t border-input">
              <th scope="row" className="px-3 py-2 text-left font-medium">{t(`rows.${row}`)}</th>
              {PULSE_COL_KEYS.map((col) => (
                <td key={col} className="px-2 py-1">
                  <Input
                    value={value[row][col] ?? ""}
                    onChange={(e) => update(row, col, e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm"
                    aria-label={t("cellLabel", { finger: t(`rows.${row}`), position: t(`cols.${col}`) })}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
